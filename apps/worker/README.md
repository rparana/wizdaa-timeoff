# `@wizdaa/worker` — Outbox consumer

NestJS app that **polls the outbox** and delivers `TIME_OFF_CREATED` (and related) payloads to the HCM ingest endpoint with **retries**, **backoff**, and a stable **`Idempotency-Key`** header per outbox row.

## Responsibilities

- Scheduled **`OutboxConsumerService.drainOutbox()`** (`@nestjs/schedule`): claims `PENDING` rows, `POST`s JSON payload to `{HCM_MOCK_URL}/hcm/outbox/ingest`, marks **`SENT`** on success or **`PENDING`** / **`FAILED`** with backoff on errors.
- **Health** HTTP server on `PORT` (default **`3002`**) for orchestration probes.

## Environment

See root **`.env.example`**. Typical variables:

| Variable                 | Role                                      |
| ------------------------ | ----------------------------------------- |
| `DATABASE_URL`           | Same SQLite DB as the API (shared file)   |
| `HCM_MOCK_URL`           | Base URL of HCM mock (no auth in dev)     |
| `HCM_REQUEST_TIMEOUT_MS` | Fetch timeout                             |
| `OUTBOX_BASE_DELAY_MS`   | Base backoff after failure                |
| `OUTBOX_MAX_BACKOFF_MS`  | Backoff cap                               |
| `OUTBOX_MAX_JITTER_MS`   | Random jitter upper bound                  |
| `PORT`                   | Health server (default `3002`)            |

## Scripts

| Command       | Purpose     |
| ------------- | ----------- |
| `pnpm dev`    | Watch mode  |
| `pnpm build`  | `dist` build |
| `pnpm start`  | Run `dist`  |

When running **next to the API** locally, use a **separate shell** and set `PORT=3002` if the API already uses `PORT=3000`.
