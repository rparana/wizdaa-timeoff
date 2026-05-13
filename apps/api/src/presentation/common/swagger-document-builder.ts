import { DocumentBuilder } from "@nestjs/swagger";

/** Single source of truth for Swagger/OpenAPI served at `/docs` and asserted in tests. */
export function buildSwaggerConfigObject() {
  return new DocumentBuilder()
    .setTitle("Time Off API")
    .setDescription(
      [
        "REST API for time-off and HCM corpus ingestion (Clean Architecture).",
        "",
        "**Validation:** Request bodies and route params are validated with `class-validator` before use cases run.",
        "**Domain errors:** Subtypes of `DomainError` are mapped globally:",
        "- `409` + `INSUFFICIENT_BALANCE` — not enough PTO for employeeId+locationId.",
        "- `422` + `INVALID_TIME_OFF_DATE_RANGE` — endDate before startDate in UTC calendar-day terms.",
        "**HTTP 400** — payload/param validation failures (Nest `BadRequestException`).",
      ].join("\n"),
    )
    .setVersion("1.0")
    .build();
}
