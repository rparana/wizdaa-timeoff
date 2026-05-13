import { Inject, Injectable } from "@nestjs/common";
import {
  TIME_OFF_REPOSITORY,
  TimeOffRepository,
} from "../../domain/time-off/time-off.repository";
import { TimeOffRequest } from "../../domain/time-off/time-off-request.entity";

@Injectable()
export class ListTimeOffUseCase {
  constructor(
    @Inject(TIME_OFF_REPOSITORY)
    private readonly timeOffRepository: TimeOffRepository,
  ) {}

  execute(): Promise<TimeOffRequest[]> {
    return this.timeOffRepository.findAll();
  }
}
