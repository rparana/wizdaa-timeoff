import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./infrastructure/prisma.module";
import { TimeOffProcessingModule } from "./processing/time-off-processing.module";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    TimeOffProcessingModule,
  ],
})
export class AppModule {}
