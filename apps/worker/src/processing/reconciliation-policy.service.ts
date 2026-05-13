import { Injectable, Logger, OnModuleInit } from "@nestjs/common";

/**
 * Documents how the worker relates to API-driven HCM corpus ingestion.
 * The worker only delivers outbox events to HCM mock; it never POSTs `/hcm-sync/batch`,
 * so API batch ingestion and outbox delivery do not compete for the same concern.
 */
@Injectable()
export class ReconciliationPolicyService implements OnModuleInit {
  private readonly logger = new Logger(ReconciliationPolicyService.name);

  onModuleInit(): void {
    this.logger.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        stage: "reconciliation_policy",
        worker_scope: "outbox_delivery_only",
        api_owned_endpoints: ["POST /hcm-sync/batch"],
        interference_with_api_batch: "none",
        note: "Corpus batch sync is triggered only via the API; worker does not invoke batch sync.",
      }),
    );
  }
}
