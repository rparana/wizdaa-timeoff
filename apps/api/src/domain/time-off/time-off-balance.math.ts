import Decimal from "decimal.js";
import { InvalidTimeOffDateRangeError } from "./invalid-time-off-date-range.error";

/** Default PTO balance (days) for a new employee+location ledger row; use Decimal for all math. */
export const DEFAULT_PTO_DAYS = new Decimal("25");

const MS_PER_DAY = new Decimal("86400000");

function utcMidnightMs(d: Date): Decimal {
  const ms = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
  );
  return new Decimal(ms);
}

/**
 * Domain invariant: inclusive UTC calendar range (end on or after start).
 * Used by {@link TimeOffRequest.assertAcceptableDateRangeForRequest} / {@link TimeOffRequest.rehydrate}
 * and by {@link requestedCalendarDaysInclusiveUtc}.
 */
export function assertUtcInclusiveDateRangeValid(
  startDate: Date,
  endDate: Date,
): void {
  const startDay = utcMidnightMs(startDate);
  const endDay = utcMidnightMs(endDate);
  if (endDay.lessThan(startDay)) {
    throw new InvalidTimeOffDateRangeError(startDate, endDate);
  }
}

/** Inclusive calendar-day count in UTC; all steps use Decimal.js. */
export function requestedCalendarDaysInclusiveUtc(
  start: Date,
  end: Date,
): Decimal {
  assertUtcInclusiveDateRangeValid(start, end);
  const startDay = utcMidnightMs(start);
  const endDay = utcMidnightMs(end);
  return endDay.minus(startDay).div(MS_PER_DAY).floor().plus(1);
}
