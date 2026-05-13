import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { Response } from "express";
import { DomainError } from "../../domain/domain-error";
import { InsufficientBalanceError } from "../../domain/time-off/insufficient-balance.error";
import { InvalidTimeOffDateRangeError } from "../../domain/time-off/invalid-time-off-date-range.error";

@Catch(DomainError)
export class DomainErrorExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    const body: Record<string, unknown> = {
      statusCode: exception.httpStatus,
      code: exception.code,
      message: exception.message,
    };

    if (exception instanceof InsufficientBalanceError) {
      body.employeeId = exception.employeeId;
      body.locationId = exception.locationId;
      body.requestedDays = exception.requestedDays;
      body.availableDays = exception.availableDays;
    }

    if (exception instanceof InvalidTimeOffDateRangeError) {
      body.startDate = exception.startDate.toISOString();
      body.endDate = exception.endDate.toISOString();
    }

    res.status(exception.httpStatus).json(body);
  }
}
