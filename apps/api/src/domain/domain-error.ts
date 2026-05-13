/** Base type for application/domain failures mapped to HTTP by {@link DomainErrorExceptionFilter}. */
export abstract class DomainError extends Error {
  abstract readonly httpStatus: number;
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = new.target.name;
  }
}
