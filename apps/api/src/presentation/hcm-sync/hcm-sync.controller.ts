import { Body, Controller, Post } from "@nestjs/common";
import { ApiCreatedResponse, ApiResponse, ApiTags } from "@nestjs/swagger";
import { IngestHcmBatchUseCase } from "../../application/hcm-sync/ingest-hcm-batch.use-case";
import { apiValidationErrorResponse } from "../common/swagger-domain-responses";
import { HcmSyncBatchDto } from "./dto/hcm-sync-batch.dto";

@ApiTags("hcm-sync")
@Controller("hcm-sync")
export class HcmSyncController {
  constructor(private readonly ingestHcmBatch: IngestHcmBatchUseCase) {}

  @Post("batch")
  @ApiResponse({ status: 400, ...apiValidationErrorResponse() })
  @ApiCreatedResponse({
    description:
      "Upserts employees and departments into the local HCM corpus. All string ids are constrained to `[A-Za-z0-9._-]` with documented max lengths.",
    schema: {
      type: "object",
      required: ["employeesUpserted", "departmentsUpserted"],
      properties: {
        employeesUpserted: { type: "number", minimum: 0 },
        departmentsUpserted: { type: "number", minimum: 0 },
      },
    },
  })
  async batch(@Body() body: HcmSyncBatchDto): Promise<{
    employeesUpserted: number;
    departmentsUpserted: number;
  }> {
    return this.ingestHcmBatch.execute({
      employees: body.employees,
      departments: body.departments,
    });
  }
}
