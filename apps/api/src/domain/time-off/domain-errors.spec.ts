import { InsufficientBalanceError } from "./insufficient-balance.error";
import { InvalidTimeOffDateRangeError } from "./invalid-time-off-date-range.error";
import { DomainError } from "../domain-error";

describe("domain errors", () => {
  it("InsufficientBalanceError carries 409 metadata", () => {
    const e = new InsufficientBalanceError("a", "b", "3", "1");
    expect(e).toBeInstanceOf(DomainError);
    expect(e.httpStatus).toBe(409);
    expect(e.code).toBe("INSUFFICIENT_BALANCE");
  });

  it("InvalidTimeOffDateRangeError carries 422 metadata", () => {
    const e = new InvalidTimeOffDateRangeError(
      new Date("2026-01-01T00:00:00.000Z"),
      new Date("2025-12-31T00:00:00.000Z"),
    );
    expect(e).toBeInstanceOf(DomainError);
    expect(e.httpStatus).toBe(422);
    expect(e.code).toBe("INVALID_TIME_OFF_DATE_RANGE");
  });
});
