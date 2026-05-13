import { INestApplication } from "@nestjs/common";
import { PrismaService } from "../src/infrastructure/database/prisma.service";
import { createTestingApp } from "./testing-app";
import request from "supertest";

describe("Decimal precision & HCM batch (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestingApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns verbatim balanceDays after corpus batch + ledger upsert", async () => {
    const employeeId = "PRECISION_EMP";
    const locationId = "US_OFFICE";
    const precise = "12.3333333333";

    await prisma.employeeBalance.deleteMany({ where: { employeeId } });

    const res = await request(app.getHttpServer())
      .post("/hcm-sync/batch")
      .send({
        employees: [
          {
            id: employeeId,
            displayName: "Precision",
            email: "precision@example.com",
            departmentId: "dept_precision",
          },
        ],
        departments: [
          { id: "dept_precision", name: "Precision Dept", headcount: 1 },
        ],
      })
      .expect(201);

    expect(res.body.employeesUpserted).toBe(1);

    await prisma.employeeBalance.upsert({
      where: {
        employeeId_locationId: { employeeId, locationId },
      },
      create: {
        employeeId,
        locationId,
        balanceDays: precise,
      },
      update: { balanceDays: precise },
    });

    const getRes = await request(app.getHttpServer())
      .get(`/employee-balances/${employeeId}/${locationId}`)
      .expect(200);

    expect(getRes.body.balanceDays).toBe(precise);
  });
});
