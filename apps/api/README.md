# `@wizdaa/api` — Time Off HTTP API

NestJS service exposing time-off operations, employee balances, HCM batch ingest, and OpenAPI documentation.

## Responsibilities

- **Time off**: `POST /time-off`, `POST /time-off/request` (alias), `GET /time-off` — validates input, runs domain rules (**Decimal.js** for days), creates rows and **outbox** events in one transaction.
- **Balances**: `GET /employee-balances/:employeeId/:locationId` — returns stored `balanceDays` as a string.
- **HCM sync**: `POST /hcm-sync/batch` — upserts local corpus employees/departments.
- **Docs**: Swagger UI at **`/docs`** (same OpenAPI config as in tests via `swagger-document-builder`).

## Environment

See root **`.env.example`** and **`apps/api/.env.example`**. Minimum for local runs:

- `DATABASE_URL` — SQLite file URL used by Prisma.
- `PORT` — HTTP port (default `3000`).
- `HCM_MOCK_URL` — optional; worker uses this; API may reference for docs or future wiring.

## Scripts

| Command        | Purpose                    |
| -------------- | -------------------------- |
| `pnpm dev`     | Watch mode                 |
| `pnpm build`   | Production build to `dist` |
| `pnpm test`    | Jest (integration + unit)  |
| `pnpm test:cov`| Jest + coverage thresholds |

`pretest` runs `pnpm --filter @wizdaa/database db:generate` so the Prisma client exists before type-checking tests.
