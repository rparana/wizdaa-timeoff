# Wizdaa Time Off

A small **time-off microservice** for requesting PTO, tracking per-location balances, ingesting HCM corpus snapshots, and **reliably notifying downstream HCM** using a transactional outbox and a dedicated worker.

## Project overview

- **REST API** (`apps/api`): create/list time-off requests, read balances, batch-ingest employee/department corpus data. OpenAPI UI at **`/docs`**.
- **Worker** (`apps/worker`): drains the **outbox** table, posts events to the HCM mock with **idempotent retries** and exponential backoff.
- **Database** (`packages/database`): **Prisma** + **SQLite** schema (balances, requests, outbox, HCM corpus tables).
- **HCM mock** (`apps/hcm-mock`): lightweight HTTP stand-in for HCM ingest with idempotency support.

Monorepo orchestration uses **Turborepo** and **pnpm** workspaces.

## Key architectural decisions

### Transactional outbox

When a time-off request is accepted, the API persists the request, decrements the balance, and inserts an **outbox** row in the **same database transaction**. The worker delivers to HCM asynchronously. If HCM is down, rows stay **`PENDING`** with bounded retries until **`SENT`** or **`FAILED`**, without losing events.

### Concurrency and pessimistic-style locking (Prisma + SQLite)

Balance updates run inside a **Prisma interactive transaction** so read–modify–write on `EmployeeBalance` is atomic. **Pessimistic locking** (`SELECT … FOR UPDATE`) is the usual pattern on PostgreSQL; on **SQLite** that syntax is invalid, so this codebase relies on **short exclusive transactions** and SQLite’s writer semantics instead, with **`PRAGMA journal_mode=WAL`** enabled at `PrismaService` startup to improve concurrent access. If you move to PostgreSQL, you can reintroduce `FOR UPDATE` on the balance row inside the same transaction for true row-level locks.

### Decimal.js

PTO amounts are **decimal strings** in the database. The API uses **Decimal.js** for day math and comparisons so balances and requested days avoid floating-point drift. GET responses return **`balanceDays` verbatim** from storage for exact client-visible precision.

## Tech stack

| Layer        | Choice                          |
| ------------ | ------------------------------- |
| Monorepo     | **Turborepo**, **pnpm**         |
| API / worker | **NestJS** 10                   |
| ORM          | **Prisma** 6                    |
| Database     | **SQLite** (`file:` URLs)       |
| Runtime      | **Docker** + **docker-compose** |

## Quick start

### Prerequisites

- **Node.js** ≥ 20  
- **pnpm** 9.x (see `packageManager` in root `package.json`)  
- **Docker** (optional, for compose stack)

### Install

```bash
pnpm install
pnpm db:generate
```

### Local database (without Docker)

Environment samples live at **`.env.example`** (repo root) and **`apps/<name>/.env.example`** per service. Typical setup:

```bash
cp .env.example .env
# Optionally copy app-specific examples, e.g.:
# cp apps/api/.env.example apps/api/.env
# Edit DATABASE_URL if needed, then:
pnpm db:migrate:deploy
```

Run services in separate terminals. Each process needs a consistent **`DATABASE_URL`** for API + worker, **`PORT`** per app (mock **3001**, API **3000**, worker **3002**), and the worker needs **`HCM_MOCK_URL`** pointing at the mock.

```bash
# Terminal 1 — HCM mock (port 3001)
pnpm --filter @wizdaa/hcm-mock dev

# Terminal 2 — API (default port 3000)
pnpm --filter @wizdaa/api dev

# Terminal 3 — worker (default port 3002; set HCM_MOCK_URL=http://127.0.0.1:3001)
pnpm --filter @wizdaa/worker dev
```

### Docker Compose

From the repo root:

```bash
docker compose up --build
```

- **API & Swagger**: [http://localhost:3000/docs](http://localhost:3000/docs)  
- **API health**: [http://localhost:3000/health](http://localhost:3000/health)  
- **HCM mock**: `http://localhost:3001`  
- **Worker health**: `http://localhost:3002/health`  

Compose uses a shared **named volume** for `file:/data/app.db` so API and worker share one SQLite file.

## Testing

Root **`pnpm test`** runs **`turbo run test`** with **parallel** package tasks (`concurrency` in `turbo.json`). Each workspace that defines **`test`** runs it after its **`^build`** dependencies finish (so `@wizdaa/database` builds before `@wizdaa/api` / `@wizdaa/worker` tests).

**`pnpm test:cov`** runs **`turbo run test:cov`** the same way (adds a root script; each app implements `test:cov`).

**API** (`apps/api`): integration + unit tests against a dedicated SQLite file; **100%** statements/branches/functions/lines on `src/domain` and `src/application` (see `jest.config.cjs`).

**Worker** (`apps/worker`): integration tests for outbox delivery (e.g. HCM failure → retry → success) using `apps/worker/integration.test.db` and the same Prisma migrations as the API.

```bash
# All workspace tests (Turbo, parallel across packages)
pnpm test

# All workspace coverage tasks (where defined)
pnpm test:cov

# Per package
pnpm --filter @wizdaa/api test:cov
pnpm --filter @wizdaa/worker test:cov
```

## Repository layout

```
apps/
  api/          # NestJS HTTP API
  worker/       # Outbox consumer + health
  hcm-mock/     # Dev HCM ingest stub
packages/
  database/     # Prisma schema & migrations
```

## License

Private / internal unless otherwise noted.
