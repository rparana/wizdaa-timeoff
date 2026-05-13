import { Test } from "@nestjs/testing";
import { OutboxConsumerService } from "./outbox-consumer.service";
import { PrismaService } from "../infrastructure/prisma.service";

function mockRow(overrides: Partial<{ attempts: number }> = {}) {
  return {
    id: "obx-1",
    eventType: "TIME_OFF_CREATED",
    aggregateType: "TimeOffRequest",
    aggregateId: "tor-1",
    payload: "{}",
    idempotencyKey: "outbox_tor-1",
    status: "PENDING",
    attempts: overrides.attempts ?? 0,
    nextAttemptAt: null,
    lastError: null,
    processedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("OutboxConsumerService (unit)", () => {
  let service: OutboxConsumerService;
  let prisma: {
    outbox: {
      findMany: jest.Mock;
      updateMany: jest.Mock;
      update: jest.Mock;
    };
  };
  let fetchMock: jest.Mock;

  beforeEach(async () => {
    process.env.HCM_MOCK_URL = "http://hcm.test";
    process.env.OUTBOX_BASE_DELAY_MS = "0";
    process.env.OUTBOX_MAX_JITTER_MS = "0";
    process.env.OUTBOX_MAX_BACKOFF_MS = "1000";
    process.env.HCM_REQUEST_TIMEOUT_MS = "not-a-number";

    prisma = {
      outbox: {
        findMany: jest.fn(),
        updateMany: jest.fn(),
        update: jest.fn(),
      },
    };

    const mod = await Test.createTestingModule({
      providers: [
        OutboxConsumerService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = mod.get(OutboxConsumerService);
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("does nothing when no pending rows", async () => {
    prisma.outbox.findMany.mockResolvedValue([]);
    await service.drainOutbox();
    expect(prisma.outbox.updateMany).not.toHaveBeenCalled();
  });

  it("continues when optimistic claim loses the race (updateMany count 0)", async () => {
    prisma.outbox.findMany.mockResolvedValue([mockRow()]);
    prisma.outbox.updateMany.mockResolvedValue({ count: 0 });
    await service.drainOutbox();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws on 200 response when JSON body ok is not true", async () => {
    prisma.outbox.findMany.mockResolvedValue([mockRow()]);
    prisma.outbox.updateMany.mockResolvedValue({ count: 1 });
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: false }),
    });
    prisma.outbox.update.mockResolvedValue({});

    await service.drainOutbox();

    expect(prisma.outbox.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "PENDING",
          attempts: 1,
        }),
      }),
    );
  });

  it("marks SENT and logs duplicateAck when HCM returns duplicate", async () => {
    prisma.outbox.findMany.mockResolvedValue([mockRow()]);
    prisma.outbox.updateMany.mockResolvedValue({ count: 1 });
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, duplicate: true }),
    });
    prisma.outbox.update.mockResolvedValue({});

    await service.drainOutbox();

    expect(prisma.outbox.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "SENT" }),
      }),
    );
  });

  it("sets FAILED when max attempts exceeded", async () => {
    prisma.outbox.findMany.mockResolvedValue([mockRow({ attempts: 11 })]);
    prisma.outbox.updateMany.mockResolvedValue({ count: 1 });
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });
    prisma.outbox.update.mockResolvedValue({});

    await service.drainOutbox();

    expect(prisma.outbox.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "FAILED",
          attempts: 12,
        }),
      }),
    );
  });

  it("strips trailing slash from HCM_MOCK_URL before calling ingest", async () => {
    process.env.HCM_MOCK_URL = "http://hcm.test/";
    prisma.outbox.findMany.mockResolvedValue([mockRow()]);
    prisma.outbox.updateMany.mockResolvedValue({ count: 1 });
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    prisma.outbox.update.mockResolvedValue({});

    await service.drainOutbox();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://hcm.test/hcm/outbox/ingest",
      expect.any(Object),
    );
  });

  it("uses non-Error message when json() rejects with a string", async () => {
    prisma.outbox.findMany.mockResolvedValue([mockRow()]);
    prisma.outbox.updateMany.mockResolvedValue({ count: 1 });
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw "sync";
      },
    });
    prisma.outbox.update.mockResolvedValue({});

    await service.drainOutbox();

    expect(prisma.outbox.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lastError: "sync",
        }),
      }),
    );
  });

  it("defaults HCM_MOCK_URL when unset", async () => {
    const prev = process.env.HCM_MOCK_URL;
    delete process.env.HCM_MOCK_URL;
    prisma.outbox.findMany.mockResolvedValue([mockRow()]);
    prisma.outbox.updateMany.mockResolvedValue({ count: 1 });
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    prisma.outbox.update.mockResolvedValue({});

    await service.drainOutbox();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:3001/hcm/outbox/ingest",
      expect.any(Object),
    );
    process.env.HCM_MOCK_URL = prev;
  });

  it("treats negative numeric env as fallback for backoff tuning", async () => {
    process.env.OUTBOX_BASE_DELAY_MS = "-5";
    prisma.outbox.findMany.mockResolvedValue([mockRow()]);
    prisma.outbox.updateMany.mockResolvedValue({ count: 1 });
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });
    prisma.outbox.update.mockResolvedValue({});

    await service.drainOutbox();

    expect(prisma.outbox.update).toHaveBeenCalled();
  });
});
