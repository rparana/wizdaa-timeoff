import { Module } from "@nestjs/common";
import { HcmController } from "./hcm.controller";
import { OutboxIngestService } from "./outbox-ingest.service";

@Module({
  controllers: [HcmController],
  providers: [OutboxIngestService],
})
export class HcmModule {}
