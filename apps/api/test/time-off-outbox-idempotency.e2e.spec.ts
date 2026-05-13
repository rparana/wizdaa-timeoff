import { INestApplication } from "@nestjs/common";
import { PrismaService } from "../src/infrastructure/database/prisma.service";
import { outboxIdempotencyKeyForTimeOff } from "../src/infrastructure/time-off/prisma-time-off.repository";
import { createTestingApp } from "./testing-app";
import request from "supertest";

describe("Time-off outbox row (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestingApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.outbox.deleteMany();
    await prisma.timeOffRequest.deleteMany();
    await prisma.employeeBalance.deleteMany();
    await prisma.employeeBalance.create({
      data: {
        employeeId: "OUTBOX_IDEM",
        locationId: "US_OFFICE",
        balanceDays: "5",
      },
    });
  });

  it("persists deterministic idempotency key and payload fields for worker sync", async () => {
    const res = await request(app.getHttpServer())
      .post("/time-off/request")
      .send({
        employeeId: "OUTBOX_IDEM",
        locationId: "US_OFFICE",
        startDate: "2026-08-01T00:00:00.000Z",
        endDate: "2026-08-01T00:00:00.000Z",
      })
      .expect(201);

    const timeOffId = res.body.id as string;
    const outbox = await prisma.outbox.findFirst({
      where: { aggregateId: timeOffId },
    });

    expect(outbox).not.toBeNull();
    const expectedKey = outboxIdempotencyKeyForTimeOff(timeOffId);
    expect(outbox?.idempotencyKey).toBe(expectedKey);

    const payload = JSON.parse(outbox?.payload ?? "{}") as {
      balanceAfter?: string;
      idempotencyKey?: string;
      timeOffRequestId?: string;
    };
    expect(payload.timeOffRequestId).toBe(timeOffId);
    expect(payload.balanceAfter).toBe("4");
    expect(payload.idempotencyKey).toBe(expectedKey);
  });
});
