import { Module } from "@nestjs/common";
import { CreateTimeOffUseCase } from "../../application/time-off/create-time-off.use-case";
import { ListTimeOffUseCase } from "../../application/time-off/list-time-off.use-case";
import { TIME_OFF_REPOSITORY } from "../../domain/time-off/time-off.repository";
import { PrismaTimeOffRepository } from "../../infrastructure/time-off/prisma-time-off.repository";
import { TimeOffController } from "./time-off.controller";

@Module({
  controllers: [TimeOffController],
  providers: [
    CreateTimeOffUseCase,
    ListTimeOffUseCase,
    {
      provide: TIME_OFF_REPOSITORY,
      useClass: PrismaTimeOffRepository,
    },
  ],
})
export class TimeOffModule {}
