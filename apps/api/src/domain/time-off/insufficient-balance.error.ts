import { DomainError } from "../domain-error";

export class InsufficientBalanceError extends DomainError {
  readonly httpStatus = 409;
  readonly code = "INSUFFICIENT_BALANCE";

  constructor(
    public readonly employeeId: string,
    public readonly locationId: string,
    public readonly requestedDays: string,
    public readonly availableDays: string,
  ) {
    super(
      `Insufficient PTO balance for employee ${employeeId} at location ${locationId}: requested ${requestedDays}, available ${availableDays}`,
    );
  }
}
