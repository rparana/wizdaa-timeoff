import { INestApplication } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { OutboxConsumerService } from "@worker/processing/outbox-consumer.service";
import { PrismaService as WorkerPrismaService } from "@worker/infrastructure/prisma.service";
import { PrismaService } from "../src/infrastructure/database/prisma.service";
import { createTestingApp } from "./testing-app";

describe("Outbox worker resilience (integration)", () => {
  let apiApp: INestApplication;
  let workerApp: INestApplication;
  let prisma: PrismaService;
  let consumer: OutboxConsumerService;
  let fetchMock: jest.Mock;

  beforeAll(async () => {
    process.env.OUTBOX_BASE_DELAY_MS = "0";
    process.env.OUTBOX_MAX_JITTER_MS = "0";
    process.env.OUTBOX_MAX_BACKOFF_MS = "1000";

    apiApp = await createTestingApp();
    prisma = apiApp.get(PrismaService);

    const workerModuleRef = await Test.createTestingModule({
      imports: [ScheduleModule.forRoot()],
      providers: [
        OutboxConsumerService,
        { provide: WorkerPrismaService, useValue: prisma },
      ],
    }).compile();

    workerApp = workerModuleRef.createNestApplication();
    await workerApp.init();
    consumer = workerApp.get(OutboxConsumerService);
  });

  afterAll(async () => {
    await workerApp.close();
    await apiApp.close();
  });

  beforeEach(async () => {
    await prisma.outbox.deleteMany();
    await prisma.timeOffRequest.deleteMany();
    await prisma.employeeBalance.deleteMany();
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("retries on HCM 500 after API time-off create, then succeeds when HCM returns 200", async () => {
    await prisma.employeeBalance.create({
      data: {
        employeeId: "WORKER_E2E",
        locationId: "US_OFFICE",
        balanceDays: "5",
      },
    });

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const postRes = await request(apiApp.getHttpServer())
      .post("/time-off/request")
      .send({
        employeeId: "WORKER_E2E",
        locationId: "US_OFFICE",
        startDate: "2026-07-01T00:00:00.000Z",
        endDate: "2026-07-01T00:00:00.000Z",
      })
      .expect(201);

    await consumer.drainOutbox();

    const afterFail = await prisma.outbox.findFirst({
      where: { aggregateId: postRes.body.id },
    });
    expect(afterFail?.status).toBe("PENDING");
    expect((afterFail?.attempts ?? 0) > 0).toBe(true);

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });

    await new Promise((r) => setTimeout(r, 50));
    await consumer.drainOutbox();

    const afterOk = await prisma.outbox.findFirst({
      where: { aggregateId: postRes.body.id },
    });
    expect(afterOk?.status).toBe("SENT");
    expect(afterOk?.processedAt).not.toBeNull();

    const keys = fetchMock.mock.calls.map(
      (c) => (c[1]?.headers as Record<string, string>)?.["Idempotency-Key"],
    );
    const idempotencyKey = afterOk?.idempotencyKey;
    expect(idempotencyKey).toBeDefined();
    expect(keys.every((k) => k === idempotencyKey)).toBe(true);
  });
});
