import { Test } from "@nestjs/testing";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { IngestHcmBatchUseCase } from "./ingest-hcm-batch.use-case";

describe("IngestHcmBatchUseCase", () => {
  it("runs transactional upserts", async () => {
    const tx = {
      hcmCorpusEmployee: { upsert: jest.fn().mockResolvedValue({}) },
      hcmCorpusDepartment: { upsert: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      $transaction: jest.fn(async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
    } as unknown as PrismaService;

    const mod = await Test.createTestingModule({
      providers: [
        IngestHcmBatchUseCase,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    const uc = mod.get(IngestHcmBatchUseCase);
    const out = await uc.execute({
      employees: [
        {
          id: "e1",
          displayName: "N",
          email: "n@n.com",
          departmentId: "d1",
        },
      ],
      departments: [{ id: "d1", name: "D", headcount: 2 }],
    });

    expect(out.employeesUpserted).toBe(1);
    expect(out.departmentsUpserted).toBe(1);
    expect(tx.hcmCorpusEmployee.upsert).toHaveBeenCalledTimes(1);
    expect(tx.hcmCorpusDepartment.upsert).toHaveBeenCalledTimes(1);
  });

  it("maps omitted managerId and headcount to null on create/update", async () => {
    const tx = {
      hcmCorpusEmployee: { upsert: jest.fn().mockResolvedValue({}) },
      hcmCorpusDepartment: { upsert: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      $transaction: jest.fn(async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx)),
    } as unknown as PrismaService;

    const mod = await Test.createTestingModule({
      providers: [
        IngestHcmBatchUseCase,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    const uc = mod.get(IngestHcmBatchUseCase);
    await uc.execute({
      employees: [
        {
          id: "e1",
          displayName: "N",
          email: "n@n.com",
          departmentId: "d1",
        },
      ],
      departments: [{ id: "d1", name: "D" }],
    });

    expect(tx.hcmCorpusEmployee.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ managerId: null }),
        update: expect.objectContaining({ managerId: null }),
      }),
    );
    expect(tx.hcmCorpusDepartment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ headcount: null }),
        update: expect.objectContaining({ headcount: null }),
      }),
    );
  });
});
