/**
 * Balance persistence: `balanceDays` is a decimal string in SQLite. Every balance read,
 * comparison, and mutation MUST go through `Decimal.js` — never `Number()` or native
 * arithmetic on balance strings.
 *
 * SQLite notes:
 * - `PRAGMA journal_mode=WAL` cannot run inside Prisma’s interactive transaction (SQLite
 *   rejects it). WAL is enabled once per connection in {@link PrismaService.onModuleInit}.
 * - This method uses a single interactive `$transaction` so balance read + updates are
 *   serialized with other writers; `INSERT OR IGNORE` seeds the ledger row before read.
 */
import { Injectable } from "@nestjs/common";
import Decimal from "decimal.js";
import { Prisma } from "@wizdaa/database";
import { PrismaService } from "../database/prisma.service";
import { TimeOffRequest } from "../../domain/time-off/time-off-request.entity";
import { TimeOffRepository } from "../../domain/time-off/time-off.repository";
import { isTimeOffStatus } from "../../domain/time-off/time-off-status";
import { InsufficientBalanceError } from "../../domain/time-off/insufficient-balance.error";
import { DEFAULT_PTO_DAYS } from "../../domain/time-off/time-off-balance.math";

/** Deterministic idempotency key for outbox → HCM (`outbox_<TimeOffRequest.id>`). */
export function outboxIdempotencyKeyForTimeOff(timeOffRequestId: string): string {
  return `outbox_${timeOffRequestId}`;
}

@Injectable()
export class PrismaTimeOffRepository implements TimeOffRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createWithOutboxAndBalanceLock(input: {
    employeeId: string;
    locationId: string;
    startDate: Date;
    endDate: Date;
    reason?: string | null;
    requestedDaysDecimalString: string;
  }): Promise<TimeOffRequest> {
    const requested = new Decimal(input.requestedDaysDecimalString);

    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(
          `INSERT OR IGNORE INTO "EmployeeBalance" ("employeeId", "locationId", "balanceDays", "createdAt", "updatedAt")
           VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
          input.employeeId,
          input.locationId,
          DEFAULT_PTO_DAYS.toString(),
        );

        const row = await tx.employeeBalance.findUnique({
          where: {
            employeeId_locationId: {
              employeeId: input.employeeId,
              locationId: input.locationId,
            },
          },
        });

        if (!row) {
          throw new InsufficientBalanceError(
            input.employeeId,
            input.locationId,
            requested.toString(),
            "0",
          );
        }

        const current = new Decimal(row.balanceDays);
        if (current.lessThan(requested)) {
          throw new InsufficientBalanceError(
            input.employeeId,
            input.locationId,
            requested.toString(),
            current.toString(),
          );
        }

        const newBalance = current.minus(requested);

        await tx.employeeBalance.update({
          where: {
            employeeId_locationId: {
              employeeId: input.employeeId,
              locationId: input.locationId,
            },
          },
          data: { balanceDays: newBalance.toString() },
        });

        const timeOff = await tx.timeOffRequest.create({
          data: {
            employeeId: input.employeeId,
            locationId: input.locationId,
            startDate: input.startDate,
            endDate: input.endDate,
            reason: input.reason ?? null,
            daysRequested: requested.toString(),
          },
        });

        const idempotencyKey = outboxIdempotencyKeyForTimeOff(timeOff.id);
        const payload = {
          eventType: "TIME_OFF_CREATED",
          timeOffRequestId: timeOff.id,
          employeeId: timeOff.employeeId,
          locationId: timeOff.locationId,
          startDate: timeOff.startDate.toISOString(),
          endDate: timeOff.endDate.toISOString(),
          daysRequested: requested.toString(),
          balanceAfter: newBalance.toString(),
          idempotencyKey,
        };

        await tx.outbox.create({
          data: {
            eventType: "TIME_OFF_CREATED",
            aggregateType: "TimeOffRequest",
            aggregateId: timeOff.id,
            payload: JSON.stringify(payload),
            idempotencyKey,
            status: "PENDING",
          },
        });

        return this.toDomain(timeOff);
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 10_000,
        timeout: 30_000,
      },
    );
  }

  async findAll(): Promise<TimeOffRequest[]> {
    const rows = await this.prisma.timeOffRequest.findMany({
      orderBy: { createdAt: "desc" },
    });
    return rows.map((r) => this.toDomain(r));
  }

  private toDomain(row: {
    id: string;
    employeeId: string;
    locationId: string;
    startDate: Date;
    endDate: Date;
    reason: string | null;
    status: string;
    daysRequested: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): TimeOffRequest {
    const status = isTimeOffStatus(row.status) ? row.status : "PENDING";
    return TimeOffRequest.rehydrate({
      id: row.id,
      employeeId: row.employeeId,
      locationId: row.locationId,
      startDate: row.startDate,
      endDate: row.endDate,
      reason: row.reason,
      status,
      daysRequested: row.daysRequested,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
