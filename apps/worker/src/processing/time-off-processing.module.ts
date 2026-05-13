import { Module } from "@nestjs/common";
import { OutboxConsumerService } from "./outbox-consumer.service";
import { ReconciliationPolicyService } from "./reconciliation-policy.service";

@Module({
  providers: [OutboxConsumerService, ReconciliationPolicyService],
})
export class TimeOffProcessingModule {}
