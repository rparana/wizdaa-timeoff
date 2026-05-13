import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";

export interface EmployeeBalanceResult {
  employeeId: string;
  locationId: string;
  /** Canonical decimal string; all reads normalized with Decimal.js */
  balanceDays: string;
}

@Injectable()
export class GetEmployeeBalanceUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    employeeId: string,
    locationId: string,
  ): Promise<EmployeeBalanceResult> {
    const row = await this.prisma.employeeBalance.findUnique({
      where: {
        employeeId_locationId: { employeeId, locationId },
      },
    });

    if (!row) {
      throw new NotFoundException(
        `No balance for employeeId=${employeeId} locationId=${locationId}`,
      );
    }

    return {
      employeeId: row.employeeId,
      locationId: row.locationId,
      balanceDays: row.balanceDays,
    };
  }
}
