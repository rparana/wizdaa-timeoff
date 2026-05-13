import { Test } from "@nestjs/testing";
import { ListTimeOffUseCase } from "./list-time-off.use-case";
import { TIME_OFF_REPOSITORY } from "../../domain/time-off/time-off.repository";
import { TimeOffRequest } from "../../domain/time-off/time-off-request.entity";

describe("ListTimeOffUseCase", () => {
  it("returns repository list", async () => {
    const rows = [
      TimeOffRequest.rehydrate({
        id: "1",
        employeeId: "A",
        locationId: "L",
        startDate: new Date("2026-01-01T00:00:00.000Z"),
        endDate: new Date("2026-01-01T00:00:00.000Z"),
        reason: null,
        status: "PENDING",
        daysRequested: "1",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    ];
    const repo = { findAll: jest.fn().mockResolvedValue(rows) };

    const mod = await Test.createTestingModule({
      providers: [
        ListTimeOffUseCase,
        { provide: TIME_OFF_REPOSITORY, useValue: repo },
      ],
    }).compile();

    const uc = mod.get(ListTimeOffUseCase);
    const r = await uc.execute();
    expect(r).toEqual(rows);
  });
});
