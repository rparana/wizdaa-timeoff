import { Inject, Injectable } from "@nestjs/common";
import Decimal from "decimal.js";
import {
  TIME_OFF_REPOSITORY,
  TimeOffRepository,
} from "../../domain/time-off/time-off.repository";
import { TimeOffRequest } from "../../domain/time-off/time-off-request.entity";
import { requestedCalendarDaysInclusiveUtc } from "../../domain/time-off/time-off-balance.math";

export interface CreateTimeOffCommand {
  employeeId: string;
  locationId: string;
  startDate: Date;
  endDate: Date;
  reason?: string | null;
}

/**
 * Creates a time-off request using Decimal.js for all PTO day math.
 * Date-range rules are enforced in the domain layer ({@link TimeOffRequest.assertAcceptableDateRangeForRequest} /
 * {@link requestedCalendarDaysInclusiveUtc}); insufficient balance surfaces as {@link InsufficientBalanceError}
 * (409) via the global domain exception filter.
 */
@Injectable()
export class CreateTimeOffUseCase {
  constructor(
    @Inject(TIME_OFF_REPOSITORY)
    private readonly timeOffRepository: TimeOffRepository,
  ) {}

  execute(command: CreateTimeOffCommand): Promise<TimeOffRequest> {
    TimeOffRequest.assertAcceptableDateRangeForRequest(
      command.startDate,
      command.endDate,
    );
    const requested: Decimal = requestedCalendarDaysInclusiveUtc(
      command.startDate,
      command.endDate,
    );

    return this.timeOffRepository.createWithOutboxAndBalanceLock({
      employeeId: command.employeeId,
      locationId: command.locationId,
      startDate: command.startDate,
      endDate: command.endDate,
      reason: command.reason ?? null,
      requestedDaysDecimalString: requested.toString(),
    });
  }
}
