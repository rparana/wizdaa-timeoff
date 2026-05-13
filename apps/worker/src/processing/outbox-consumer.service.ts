import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../infrastructure/prisma.service";
import { computeNextAttemptDelayMs } from "./outbox-backoff";

const MAX_ATTEMPTS = 12;

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return fallback;
  }
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function logStructured(
  logger: Logger,
  level: "log" | "warn" | "error",
  payload: Record<string, unknown>,
): void {
  logger[level](
    JSON.stringify({
      ts: new Date().toISOString(),
      component: "OutboxConsumerService",
      ...payload,
    }),
  );
}

@Injectable()
export class OutboxConsumerService {
  private readonly logger = new Logger(OutboxConsumerService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async drainOutbox(): Promise<void> {
    const baseUrl = (process.env.HCM_MOCK_URL ?? "http://127.0.0.1:3001").replace(
      /\/$/,
      "",
    );
    const timeoutMs = envInt("HCM_REQUEST_TIMEOUT_MS", 5_000);
    const baseDelayMs = envInt("OUTBOX_BASE_DELAY_MS", 1_000);
    const maxBackoffMs = envInt("OUTBOX_MAX_BACKOFF_MS", 900_000);
    const maxJitterMs = envInt("OUTBOX_MAX_JITTER_MS", 500);
    const now = new Date();

    const rows = await this.prisma.outbox.findMany({
      where: {
        status: "PENDING",
        attempts: { lt: MAX_ATTEMPTS },
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: now } }],
      },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    for (const row of rows) {
      const claimed = await this.prisma.outbox.updateMany({
        where: { id: row.id, status: "PENDING" },
        data: { status: "PROCESSING" },
      });
      if (claimed.count === 0) {
        continue;
      }

      logStructured(this.logger, "log", {
        stage: "attempting_sync",
        outboxId: row.id,
        idempotencyKey: row.idempotencyKey,
        aggregateType: row.aggregateType,
        aggregateId: row.aggregateId,
        attempt: row.attempts + 1,
        maxAttempts: MAX_ATTEMPTS,
        hcmUrl: `${baseUrl}/hcm/outbox/ingest`,
        timeoutMs,
      });

      try {
        const res = await fetch(`${baseUrl}/hcm/outbox/ingest`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            /** Same key on every retry so HCM treats retries as one logical delivery. */
            "Idempotency-Key": row.idempotencyKey,
          },
          body: row.payload,
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (!res.ok) {
          throw new Error(`HCM ingest failed with HTTP ${res.status}`);
        }

        const json = (await res.json()) as { ok?: boolean; duplicate?: boolean };
        if (json?.ok !== true) {
          throw new Error("HCM ingest returned unexpected body");
        }

        await this.prisma.outbox.update({
          where: { id: row.id },
          data: {
            status: "SENT",
            processedAt: new Date(),
            lastError: null,
            nextAttemptAt: null,
          },
        });

        logStructured(this.logger, "log", {
          stage: "sync_succeeded",
          outboxId: row.id,
          idempotencyKey: row.idempotencyKey,
          duplicateAck: json.duplicate === true,
        });
      } catch (err) {
        const attempts = row.attempts + 1;
        const message = err instanceof Error ? err.message : String(err);
        const isFinal = attempts >= MAX_ATTEMPTS;

        if (isFinal) {
          await this.prisma.outbox.update({
            where: { id: row.id },
            data: {
              status: "FAILED",
              attempts,
              lastError: message,
              nextAttemptAt: null,
            },
          });

          logStructured(this.logger, "error", {
            level: "CRITICAL",
            stage: "outbox_permanent_failure",
            outboxId: row.id,
            idempotencyKey: row.idempotencyKey,
            attempts,
            maxAttempts: MAX_ATTEMPTS,
            lastError: message,
            message:
              "Outbox entry exceeded max retries; status set to FAILED. Manual intervention may be required.",
          });
          continue;
        }

        const delayMs = computeNextAttemptDelayMs({
          exponent: row.attempts,
          baseDelayMs,
          maxBackoffMs,
          maxJitterMs,
        });
        const nextAttemptAt = new Date(Date.now() + delayMs);

        await this.prisma.outbox.update({
          where: { id: row.id },
          data: {
            status: "PENDING",
            attempts,
            lastError: message,
            nextAttemptAt,
          },
        });

        logStructured(this.logger, "warn", {
          stage: "sync_failed_retry_scheduled",
          outboxId: row.id,
          idempotencyKey: row.idempotencyKey,
          attempt: attempts,
          maxAttempts: MAX_ATTEMPTS,
          lastError: message,
          retryInSeconds: Math.round(delayMs / 1000),
          retryInMs: delayMs,
          nextAttemptAt: nextAttemptAt.toISOString(),
          backoffExponent: row.attempts,
          backoffFormula: `min(${maxBackoffMs}, ${baseDelayMs} * 2^${row.attempts}) + jitter[0..${maxJitterMs}]`,
        });
      }
    }
  }
}
