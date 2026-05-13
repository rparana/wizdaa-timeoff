/**
 * Balance persistence: `balanceDays` is a decimal string in SQLite. Every balance read,
 * comparison, and mutation MUST go through `Decimal.js` — never `Number()` or native
 * arithmetic on balance strings.
 */
import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import Decimal from "decimal.js";
import { Prisma } from "@wizdaa/database";
import { PrismaService } from "../database/prisma.service";
import { TimeOffRequest } from "../../domain/time-off/time-off-request.entity";
import { TimeOffRepository } from "../../domain/time-off/time-off.repository";
import { isTimeOffStatus } from "../../domain/time-off/time-off-status";
import { InsufficientBalanceError } from "../../domain/time-off/insufficient-balance.error";
import { DEFAULT_PTO_DAYS } from "../../domain/time-off/time-off-balance.math";

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

        const locked = await tx.$queryRaw<
          { employeeId: string; locationId: string; balanceDays: string }[]
        >(Prisma.sql`
          SELECT "employeeId", "locationId", "balanceDays"
          FROM "EmployeeBalance"
          WHERE "employeeId" = ${input.employeeId}
            AND "locationId" = ${input.locationId}
        `);

        const row = locked[0];
        if (!row) {
          throw new Error(
            `Missing employee balance row for employeeId=${input.employeeId} locationId=${input.locationId}`,
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

        const idempotencyKey = randomUUID();
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
      { maxWait: 10_000, timeout: 30_000 },
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
