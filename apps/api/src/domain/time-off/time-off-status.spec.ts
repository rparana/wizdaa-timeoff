import { isTimeOffStatus } from "./time-off-status";

describe("time-off-status", () => {
  it("narrows known statuses", () => {
    expect(isTimeOffStatus("PENDING")).toBe(true);
    expect(isTimeOffStatus("NOPE")).toBe(false);
  });
});
