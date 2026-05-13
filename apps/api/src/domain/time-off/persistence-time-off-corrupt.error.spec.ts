import { PersistenceTimeOffCorruptError } from "./persistence-time-off-corrupt.error";

describe("PersistenceTimeOffCorruptError", () => {
  it("wraps cause message", () => {
    const e = new PersistenceTimeOffCorruptError("row1", new Error("inner"));
    expect(e.message).toContain("row1");
    expect(e.message).toContain("inner");
  });

  it("omits suffix when cause is not an Error", () => {
    const e = new PersistenceTimeOffCorruptError("row2", "x");
    expect(e.message).toBe(
      "Persisted time-off row2 failed UTC inclusive date invariant",
    );
  });
});
