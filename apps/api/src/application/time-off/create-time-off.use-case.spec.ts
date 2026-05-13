import { Test } from "@nestjs/testing";
import { CreateTimeOffUseCase } from "./create-time-off.use-case";
import { TIME_OFF_REPOSITORY } from "../../domain/time-off/time-off.repository";
import { TimeOffRequest } from "../../domain/time-off/time-off-request.entity";
import { InvalidTimeOffDateRangeError } from "../../domain/time-off/invalid-time-off-date-range.error";

describe("CreateTimeOffUseCase", () => {
  it("rejects invalid date ranges before touching the repository", async () => {
    const repo = { createWithOutboxAndBalanceLock: jest.fn() };
    const mod = await Test.createTestingModule({
      providers: [
        CreateTimeOffUseCase,
        { provide: TIME_OFF_REPOSITORY, useValue: repo },
      ],
    }).compile();
    const uc = mod.get(CreateTimeOffUseCase);
    expect(() =>
      uc.execute({
        employeeId: "A",
        locationId: "L",
        startDate: new Date("2026-02-02T00:00:00.000Z"),
        endDate: new Date("2026-02-01T00:00:00.000Z"),
      }),
    ).toThrow(InvalidTimeOffDateRangeError);
    expect(repo.createWithOutboxAndBalanceLock).not.toHaveBeenCalled();
  });

  it("delegates to repository after domain date validation", async () => {
    const repo = {
      createWithOutboxAndBalanceLock: jest.fn().mockResolvedValue(
        TimeOffRequest.rehydrate({
          id: "1",
          employeeId: "A",
          locationId: "L",
          startDate: new Date("2026-01-01T00:00:00.000Z"),
          endDate: new Date("2026-01-02T00:00:00.000Z"),
          reason: null,
          status: "PENDING",
          daysRequested: "2",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
    };

    const mod = await Test.createTestingModule({
      providers: [
        CreateTimeOffUseCase,
        { provide: TIME_OFF_REPOSITORY, useValue: repo },
      ],
    }).compile();

    const uc = mod.get(CreateTimeOffUseCase);
    await uc.execute({
      employeeId: "A",
      locationId: "L",
      startDate: new Date("2026-01-01T00:00:00.000Z"),
      endDate: new Date("2026-01-02T00:00:00.000Z"),
    });

    expect(repo.createWithOutboxAndBalanceLock).toHaveBeenCalledWith(
      expect.objectContaining({
        employeeId: "A",
        locationId: "L",
        requestedDaysDecimalString: "2",
      }),
    );
  });
});
