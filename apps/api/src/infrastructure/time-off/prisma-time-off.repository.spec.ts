import { outboxIdempotencyKeyForTimeOff } from "./prisma-time-off.repository";

describe("outboxIdempotencyKeyForTimeOff", () => {
  it("prefixes time-off id", () => {
    expect(outboxIdempotencyKeyForTimeOff("clxyz123")).toBe("outbox_clxyz123");
  });
});
