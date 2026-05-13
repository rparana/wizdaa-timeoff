import { Body, Controller, Get, HttpCode, HttpStatus, Post } from "@nestjs/common";
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CreateTimeOffUseCase } from "../../application/time-off/create-time-off.use-case";
import { ListTimeOffUseCase } from "../../application/time-off/list-time-off.use-case";
import {
  apiInsufficientBalanceResponse,
  apiInvalidTimeOffDateRangeResponse,
  apiValidationErrorResponse,
} from "../common/swagger-domain-responses";
import { CreateTimeOffDto } from "./dto/create-time-off.dto";
import { TimeOffResponseDto } from "./dto/time-off-response.dto";

@ApiTags("time-off")
@ApiExtraModels(TimeOffResponseDto)
@Controller("time-off")
export class TimeOffController {
  constructor(
    private readonly createTimeOff: CreateTimeOffUseCase,
    private readonly listTimeOff: ListTimeOffUseCase,
  ) {}

  @Post(["", "request"])
  @HttpCode(HttpStatus.CREATED)
  @ApiResponse({ status: 400, ...apiValidationErrorResponse() })
  @ApiResponse(apiInvalidTimeOffDateRangeResponse())
  @ApiResponse(apiInsufficientBalanceResponse())
  @ApiCreatedResponse({
    type: TimeOffResponseDto,
    description:
      "Created time-off row and matching outbox event in one transaction. Routes: `POST /time-off` and `POST /time-off/request` (alias for load tests / gateways).",
  })
  async create(@Body() body: CreateTimeOffDto): Promise<TimeOffResponseDto> {
    const entity = await this.createTimeOff.execute({
      employeeId: body.employeeId,
      locationId: body.locationId,
      startDate: body.startDate,
      endDate: body.endDate,
      reason: body.reason,
    });
    return this.toResponse(entity);
  }

  @Get()
  @ApiOkResponse({
    type: TimeOffResponseDto,
    isArray: true,
    description: "Lists persisted requests (each row satisfies domain date invariants).",
  })
  async list(): Promise<TimeOffResponseDto[]> {
    const items = await this.listTimeOff.execute();
    return items.map((e) => this.toResponse(e));
  }

  private toResponse(entity: {
    id: string;
    employeeId: string;
    locationId: string;
    startDate: Date;
    endDate: Date;
    reason: string | null;
    status: string;
    daysRequested: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): TimeOffResponseDto {
    return {
      id: entity.id,
      employeeId: entity.employeeId,
      locationId: entity.locationId,
      startDate: entity.startDate,
      endDate: entity.endDate,
      reason: entity.reason,
      daysRequested: entity.daysRequested,
      status: entity.status as TimeOffResponseDto["status"],
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
