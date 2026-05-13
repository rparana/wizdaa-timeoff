import { BadRequestException, Injectable, Logger } from "@nestjs/common";

@Injectable()
export class OutboxIngestService {
  private readonly logger = new Logger(OutboxIngestService.name);
  private readonly seenKeys = new Set<string>();

  handleIngest(idempotencyKey: string | undefined, body: unknown) {
    if (!idempotencyKey || idempotencyKey.trim().length === 0) {
      throw new BadRequestException("Idempotency-Key header is required");
    }

    if (this.seenKeys.has(idempotencyKey)) {
      this.logger.debug(`Duplicate outbox delivery for key ${idempotencyKey}`);
      return { ok: true as const, duplicate: true as const };
    }

    this.seenKeys.add(idempotencyKey);
    this.logger.log(`Accepted outbox payload for key ${idempotencyKey}`);
    return { ok: true as const, duplicate: false as const, received: body };
  }
}
