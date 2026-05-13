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

Point Prisma at a file URL (see `.env.example`):

```bash
cp .env.example .env
# Edit DATABASE_URL if needed, then:
pnpm db:migrate:deploy
```

Run services in separate terminals (each needs `DATABASE_URL` and compatible `HCM_MOCK_URL`):

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

API tests use **Jest** with a dedicated integration SQLite file and **100% coverage** (statements/branches/functions/lines) on `apps/api/src/domain` and `apps/api/src/application` per `jest.config.cjs`.

```bash
# Tests + coverage report (HTML + LCOV under apps/api/coverage/)
pnpm --filter @wizdaa/api test:cov
```

From `apps/api`:

```bash
pnpm test:cov
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
