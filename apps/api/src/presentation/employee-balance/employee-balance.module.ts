import { Module } from "@nestjs/common";
import { GetEmployeeBalanceUseCase } from "../../application/employee-balance/get-employee-balance.use-case";
import { EmployeeBalanceController } from "./employee-balance.controller";

@Module({
  controllers: [EmployeeBalanceController],
  providers: [GetEmployeeBalanceUseCase],
})
export class EmployeeBalanceModule {}
