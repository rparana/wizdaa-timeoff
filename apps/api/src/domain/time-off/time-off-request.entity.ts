import { TimeOffStatus } from "./time-off-status";
import { assertUtcInclusiveDateRangeValid } from "./time-off-balance.math";
import { InvalidTimeOffDateRangeError } from "./invalid-time-off-date-range.error";
import { PersistenceTimeOffCorruptError } from "./persistence-time-off-corrupt.error";

export class TimeOffRequest {
  private constructor(
    public readonly id: string,
    public readonly employeeId: string,
    public readonly locationId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly reason: string | null,
    public readonly status: TimeOffStatus,
    public readonly daysRequested: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Validates UTC inclusive calendar range and throws {@link InvalidTimeOffDateRangeError} (422)
   * when the rule is violated — for user-driven input before persistence.
   */
  static assertAcceptableDateRangeForRequest(
    startDate: Date,
    endDate: Date,
  ): void {
    assertUtcInclusiveDateRangeValid(startDate, endDate);
  }

  /**
   * Rehydrates from persistence. Invalid date order is treated as corrupt storage (500),
   * not a client-facing 422.
   */
  static rehydrate(props: {
    id: string;
    employeeId: string;
    locationId: string;
    startDate: Date;
    endDate: Date;
    reason: string | null;
    status: TimeOffStatus;
    daysRequested: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): TimeOffRequest {
    try {
      assertUtcInclusiveDateRangeValid(props.startDate, props.endDate);
    } catch (e) {
      if (e instanceof InvalidTimeOffDateRangeError) {
        throw new PersistenceTimeOffCorruptError(props.id, e);
      }
      throw e;
    }
    return new TimeOffRequest(
      props.id,
      props.employeeId,
      props.locationId,
      props.startDate,
      props.endDate,
      props.reason,
      props.status,
      props.daysRequested,
      props.createdAt,
      props.updatedAt,
    );
  }
}
