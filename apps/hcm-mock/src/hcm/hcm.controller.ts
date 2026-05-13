import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import { MOCK_EMPLOYEES } from "./mock-data";
import { OutboxIngestService } from "./outbox-ingest.service";

@Controller("hcm")
export class HcmController {
  constructor(private readonly outboxIngest: OutboxIngestService) {}

  @Get("employees")
  listEmployees() {
    return { employees: MOCK_EMPLOYEES };
  }

  @Get("employees/:id")
  getEmployee(@Param("id") id: string) {
    const employee = MOCK_EMPLOYEES.find((e) => e.id === id);
    if (!employee) {
      throw new NotFoundException(`Unknown employee: ${id}`);
    }
    return { employee };
  }

  @Get("departments")
  listDepartments() {
    return {
      departments: [
        { id: "dept_eng", name: "Engineering", headcount: 42 },
        { id: "dept_hr", name: "People Operations", headcount: 8 },
      ],
    };
  }

  @Post("outbox/ingest")
  @HttpCode(200)
  ingest(
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Body() body: unknown,
  ) {
    return this.outboxIngest.handleIngest(idempotencyKey, body);
  }
}
