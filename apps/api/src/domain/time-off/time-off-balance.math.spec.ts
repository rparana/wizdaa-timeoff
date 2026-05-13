import {
  assertUtcInclusiveDateRangeValid,
  requestedCalendarDaysInclusiveUtc,
  DEFAULT_PTO_DAYS,
} from "./time-off-balance.math";
import { InvalidTimeOffDateRangeError } from "./invalid-time-off-date-range.error";

describe("time-off-balance.math", () => {
  it("counts inclusive UTC calendar days", () => {
    const d = requestedCalendarDaysInclusiveUtc(
      new Date("2026-06-01T12:00:00.000Z"),
      new Date("2026-06-03T00:00:00.000Z"),
    );
    expect(d.toString()).toBe("3");
  });

  it("exposes default PTO days constant", () => {
    expect(DEFAULT_PTO_DAYS.toString()).toBe("25");
  });

  it("throws InvalidTimeOffDateRangeError when end before start", () => {
    expect(() =>
      assertUtcInclusiveDateRangeValid(
        new Date("2026-06-05T00:00:00.000Z"),
        new Date("2026-06-04T00:00:00.000Z"),
      ),
    ).toThrow(InvalidTimeOffDateRangeError);
  });
});
