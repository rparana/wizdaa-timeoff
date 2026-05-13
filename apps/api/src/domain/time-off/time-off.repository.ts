import { TimeOffRequest } from "./time-off-request.entity";

export const TIME_OFF_REPOSITORY = Symbol("TIME_OFF_REPOSITORY");

export interface TimeOffRepository {
  createWithOutboxAndBalanceLock(input: {
    employeeId: string;
    locationId: string;
    startDate: Date;
    endDate: Date;
    reason?: string | null;
    requestedDaysDecimalString: string;
  }): Promise<TimeOffRequest>;
  findAll(): Promise<TimeOffRequest[]>;
}
