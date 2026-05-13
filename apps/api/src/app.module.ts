import { Module } from "@nestjs/common";
import { HealthModule } from "./presentation/health/health.module";
import { TimeOffModule } from "./presentation/time-off/time-off.module";
import { HcmSyncModule } from "./presentation/hcm-sync/hcm-sync.module";
import { EmployeeBalanceModule } from "./presentation/employee-balance/employee-balance.module";
import { PrismaModule } from "./infrastructure/database/prisma.module";

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    TimeOffModule,
    HcmSyncModule,
    EmployeeBalanceModule,
  ],
})
export class AppModule {}
