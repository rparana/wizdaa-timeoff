import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { HcmModule } from "./hcm/hcm.module";

@Module({
  imports: [HealthModule, HcmModule],
})
export class AppModule {}
