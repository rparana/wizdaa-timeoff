import { TimeOffRequest } from "./time-off-request.entity";
import { PersistenceTimeOffCorruptError } from "./persistence-time-off-corrupt.error";
import * as math from "./time-off-balance.math";

describe("TimeOffRequest", () => {
  it("rehydrates valid persisted rows", () => {
    const r = TimeOffRequest.rehydrate({
      id: "id",
      employeeId: "e",
      locationId: "l",
      startDate: new Date("2026-01-01T00:00:00.000Z"),
      endDate: new Date("2026-01-02T00:00:00.000Z"),
      reason: null,
      status: "PENDING",
      daysRequested: "2",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(r.id).toBe("id");
  });

  it("throws PersistenceTimeOffCorruptError on invalid persisted range", () => {
    expect(() =>
      TimeOffRequest.rehydrate({
        id: "bad",
        employeeId: "e",
        locationId: "l",
        startDate: new Date("2026-02-02T00:00:00.000Z"),
        endDate: new Date("2026-02-01T00:00:00.000Z"),
        reason: null,
        status: "PENDING",
        daysRequested: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow(PersistenceTimeOffCorruptError);
  });

  it("assertAcceptableDateRangeForRequest throws on bad input", () => {
    expect(() =>
      TimeOffRequest.assertAcceptableDateRangeForRequest(
        new Date("2026-03-10T00:00:00.000Z"),
        new Date("2026-03-09T00:00:00.000Z"),
      ),
    ).toThrow();
  });

  it("rethrows unexpected errors from assertUtcInclusiveDateRangeValid during rehydrate", () => {
    const spy = jest
      .spyOn(math, "assertUtcInclusiveDateRangeValid")
      .mockImplementation(() => {
        throw new Error("unexpected");
      });
    expect(() =>
      TimeOffRequest.rehydrate({
        id: "x",
        employeeId: "e",
        locationId: "l",
        startDate: new Date("2026-04-01T00:00:00.000Z"),
        endDate: new Date("2026-04-02T00:00:00.000Z"),
        reason: null,
        status: "PENDING",
        daysRequested: "2",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ).toThrow("unexpected");
    spy.mockRestore();
  });
});
