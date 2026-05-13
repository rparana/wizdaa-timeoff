import { DomainError } from "./domain-error";

class TestDomainError extends DomainError {
  readonly httpStatus = 418;
  readonly code = "TEST";
  constructor() {
    super("test");
  }
}

describe("DomainError", () => {
  it("supports concrete subclasses", () => {
    const e = new TestDomainError();
    expect(e).toBeInstanceOf(DomainError);
    expect(e.httpStatus).toBe(418);
  });
});
