import { ApiResponseOptions } from "@nestjs/swagger";

/** Shared OpenAPI fragments for domain-driven error responses (see /docs). */
export function apiInsufficientBalanceResponse(): ApiResponseOptions {
  return {
    status: 409,
    description:
      "Conflict: ledger balance for this employeeId+locationId is lower than requested days (domain rule).",
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: [
            "statusCode",
            "code",
            "message",
            "employeeId",
            "locationId",
            "requestedDays",
            "availableDays",
          ],
          properties: {
            statusCode: { type: "number", example: 409 },
            code: { type: "string", example: "INSUFFICIENT_BALANCE" },
            message: { type: "string" },
            employeeId: { type: "string" },
            locationId: { type: "string" },
            requestedDays: { type: "string", description: "Decimal days string" },
            availableDays: { type: "string", description: "Decimal days string" },
          },
        },
        examples: {
          insufficientBalance: {
            summary: "Insufficient balance (409)",
            value: {
              statusCode: 409,
              code: "INSUFFICIENT_BALANCE",
              message:
                "Insufficient PTO balance for employee A at location CURITIBA_HQ: requested 5, available 2",
              employeeId: "A",
              locationId: "CURITIBA_HQ",
              requestedDays: "5",
              availableDays: "2",
            },
          },
        },
      },
    },
  };
}

export function apiInvalidTimeOffDateRangeResponse(): ApiResponseOptions {
  return {
    status: 422,
    description:
      "Unprocessable entity: time-off date range violates UTC inclusive calendar-day rules.",
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["statusCode", "code", "message", "startDate", "endDate"],
          properties: {
            statusCode: { type: "number", example: 422 },
            code: { type: "string", example: "INVALID_TIME_OFF_DATE_RANGE" },
            message: { type: "string" },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
          },
        },
        examples: {
          invalidDateRange: {
            summary: "Invalid UTC date range (422)",
            value: {
              statusCode: 422,
              code: "INVALID_TIME_OFF_DATE_RANGE",
              message:
                "Time-off endDate must fall on or after startDate when compared as UTC calendar dates (inclusive range).",
              startDate: "2026-06-10T00:00:00.000Z",
              endDate: "2026-06-01T00:00:00.000Z",
            },
          },
        },
      },
    },
  };
}

export function apiValidationErrorResponse(): Pick<
  ApiResponseOptions,
  "description" | "content"
> {
  return {
    description:
      "Bad request: request body or route params failed `class-validator` checks (before use cases).",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            statusCode: { type: "number", example: 400 },
            message: {
              oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
            },
            error: { type: "string", example: "Bad Request" },
          },
        },
      },
    },
  };
}
