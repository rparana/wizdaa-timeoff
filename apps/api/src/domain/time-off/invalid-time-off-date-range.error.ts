import { DomainError } from "../domain-error";

export class InvalidTimeOffDateRangeError extends DomainError {
  readonly httpStatus = 422;
  readonly code = "INVALID_TIME_OFF_DATE_RANGE";

  constructor(
    public readonly startDate: Date,
    public readonly endDate: Date,
  ) {
    super(
      "Time-off endDate must fall on or after startDate when compared as UTC calendar dates (inclusive range).",
    );
  }
}
