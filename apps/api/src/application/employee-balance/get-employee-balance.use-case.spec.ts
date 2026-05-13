import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { GetEmployeeBalanceUseCase } from "./get-employee-balance.use-case";
import { PrismaService } from "../../infrastructure/database/prisma.service";

describe("GetEmployeeBalanceUseCase", () => {
  it("returns stored balance string verbatim", async () => {
    const prisma = {
      employeeBalance: {
        findUnique: jest.fn().mockResolvedValue({
          employeeId: "X",
          locationId: "L",
          balanceDays: "12.3333333333",
        }),
      },
    } as unknown as PrismaService;

    const mod = await Test.createTestingModule({
      providers: [
        GetEmployeeBalanceUseCase,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    const uc = mod.get(GetEmployeeBalanceUseCase);
    const r = await uc.execute("X", "L");
    expect(r.balanceDays).toBe("12.3333333333");
  });

  it("throws NotFound when row missing", async () => {
    const prisma = {
      employeeBalance: { findUnique: jest.fn().mockResolvedValue(null) },
    } as unknown as PrismaService;

    const mod = await Test.createTestingModule({
      providers: [
        GetEmployeeBalanceUseCase,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    const uc = mod.get(GetEmployeeBalanceUseCase);
    await expect(uc.execute("n", "o")).rejects.toBeInstanceOf(NotFoundException);
  });
});
