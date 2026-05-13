import { Controller, Get, Param } from "@nestjs/common";
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { GetEmployeeBalanceUseCase } from "../../application/employee-balance/get-employee-balance.use-case";
import { apiValidationErrorResponse } from "../common/swagger-domain-responses";
import { EmployeeBalanceResponseDto } from "./dto/employee-balance-response.dto";
import { EmployeeBalanceRouteParamsDto } from "./dto/employee-balance-route-params.dto";

@ApiTags("employee-balances")
@Controller("employee-balances")
export class EmployeeBalanceController {
  constructor(private readonly getBalance: GetEmployeeBalanceUseCase) {}

  @Get(":employeeId/:locationId")
  @ApiResponse({ status: 400, ...apiValidationErrorResponse() })
  @ApiNotFoundResponse({
    description: "No ledger row for this employeeId + locationId pair.",
  })
  @ApiOkResponse({
    type: EmployeeBalanceResponseDto,
    description:
      "Returns `balanceDays` exactly as stored in the ledger (decimal string), with no rounding or re-formatting.",
  })
  async getOne(
    @Param() params: EmployeeBalanceRouteParamsDto,
  ): Promise<EmployeeBalanceResponseDto> {
    return this.getBalance.execute(params.employeeId, params.locationId);
  }
}
