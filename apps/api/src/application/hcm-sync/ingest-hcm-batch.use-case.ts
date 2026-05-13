import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";

export interface HcmEmployeeCorpusInput {
  id: string;
  displayName: string;
  email: string;
  departmentId: string;
  managerId?: string | null;
}

export interface HcmDepartmentCorpusInput {
  id: string;
  name: string;
  headcount?: number | null;
}

export interface IngestHcmBatchCommand {
  employees: HcmEmployeeCorpusInput[];
  departments: HcmDepartmentCorpusInput[];
}

@Injectable()
export class IngestHcmBatchUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: IngestHcmBatchCommand): Promise<{
    employeesUpserted: number;
    departmentsUpserted: number;
  }> {
    return this.prisma.$transaction(async (tx) => {
      let employeesUpserted = 0;
      for (const e of command.employees) {
        const rawPayload = JSON.stringify(e);
        await tx.hcmCorpusEmployee.upsert({
          where: { id: e.id },
          create: {
            id: e.id,
            displayName: e.displayName,
            email: e.email,
            departmentId: e.departmentId,
            managerId: e.managerId ?? null,
            rawPayload,
          },
          update: {
            displayName: e.displayName,
            email: e.email,
            departmentId: e.departmentId,
            managerId: e.managerId ?? null,
            rawPayload,
          },
        });
        employeesUpserted += 1;
      }

      let departmentsUpserted = 0;
      for (const d of command.departments) {
        const rawPayload = JSON.stringify(d);
        await tx.hcmCorpusDepartment.upsert({
          where: { id: d.id },
          create: {
            id: d.id,
            name: d.name,
            headcount: d.headcount ?? null,
            rawPayload,
          },
          update: {
            name: d.name,
            headcount: d.headcount ?? null,
            rawPayload,
          },
        });
        departmentsUpserted += 1;
      }

      return { employeesUpserted, departmentsUpserted };
    });
  }
}
