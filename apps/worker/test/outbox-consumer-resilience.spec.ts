import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/infrastructure/prisma.service";
import { OutboxConsumerService } from "../src/processing/outbox-consumer.service";

/**
 * Worker-owned integration test: outbox delivery + HCM resilience.
 * DB fixtures mirror what the API persists (time-off row + outbox payload shape)
 * without importing or bootstrapping `apps/api`.
 */
describe("OutboxConsumerService resilience (integration)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let consumer: OutboxConsumerService;
  let fetchMock: jest.Mock;

  beforeAll(async () => {
    process.env.OUTBOX_BASE_DELAY_MS = "0";
    process.env.OUTBOX_MAX_JITTER_MS = "0";
    process.env.OUTBOX_MAX_BACKOFF_MS = "1000";

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
    consumer = app.get(OutboxConsumerService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await prisma.outbox.deleteMany();
    await prisma.timeOffRequest.deleteMany();
    await prisma.employeeBalance.deleteMany();
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("retries on HCM 500 for a pending outbox row, then succeeds when HCM returns 200", async () => {
    const tor = await prisma.timeOffRequest.create({
      data: {
        employeeId: "WORKER_E2E",
        locationId: "US_OFFICE",
        startDate: new Date("2026-07-01T00:00:00.000Z"),
        endDate: new Date("2026-07-01T00:00:00.000Z"),
        daysRequested: "1",
      },
    });

    const idempotencyKey = `outbox_${tor.id}`;
    const payload = {
      eventType: "TIME_OFF_CREATED",
      timeOffRequestId: tor.id,
      employeeId: tor.employeeId,
      locationId: tor.locationId,
      startDate: tor.startDate.toISOString(),
      endDate: tor.endDate.toISOString(),
      daysRequested: "1",
      balanceAfter: "4",
      idempotencyKey,
    };

    await prisma.outbox.create({
      data: {
        eventType: "TIME_OFF_CREATED",
        aggregateType: "TimeOffRequest",
        aggregateId: tor.id,
        payload: JSON.stringify(payload),
        idempotencyKey,
        status: "PENDING",
      },
    });

    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    await consumer.drainOutbox();

    const afterFail = await prisma.outbox.findFirst({
      where: { idempotencyKey },
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
      where: { idempotencyKey },
    });
    expect(afterOk?.status).toBe("SENT");
    expect(afterOk?.processedAt).not.toBeNull();

    const keys = fetchMock.mock.calls.map(
      (c) => (c[1]?.headers as Record<string, string>)?.["Idempotency-Key"],
    );
    expect(keys.every((k) => k === idempotencyKey)).toBe(true);
  });
});
