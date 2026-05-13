import { Module } from "@nestjs/common";
import { IngestHcmBatchUseCase } from "../../application/hcm-sync/ingest-hcm-batch.use-case";
import { HcmSyncController } from "./hcm-sync.controller";

@Module({
  controllers: [HcmSyncController],
  providers: [IngestHcmBatchUseCase],
})
export class HcmSyncModule {}
