import { INestApplication } from "@nestjs/common";
import { PrismaService } from "../src/infrastructure/database/prisma.service";
import { createTestingApp } from "./testing-app";
import request from "supertest";

describe("POST /time-off/request concurrency (e2e)", () => {
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
        employeeId: "C",
        locationId: "US_OFFICE",
        balanceDays: "7.5",
      },
    });
  });

  it("allows exactly 7 successes and 3 conflicts for 10 parallel 1-day requests", async () => {
    const server = app.getHttpServer();
    const body = {
      employeeId: "C",
      locationId: "US_OFFICE",
      startDate: "2026-06-10T00:00:00.000Z",
      endDate: "2026-06-10T00:00:00.000Z",
    };

    const promises = Array.from({ length: 10 }, () =>
      request(server).post("/time-off/request").send(body),
    );
    const responses = await Promise.all(promises);

    const created = responses.filter((r) => r.status === 201);
    const conflicts = responses.filter((r) => r.status === 409);

    expect(created).toHaveLength(7);
    expect(conflicts).toHaveLength(3);

    const balance = await prisma.employeeBalance.findUnique({
      where: {
        employeeId_locationId: { employeeId: "C", locationId: "US_OFFICE" },
      },
    });
    expect(balance?.balanceDays).toBe("0.5");
  });
});
