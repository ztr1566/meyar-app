# Task 3 Report

Status: DONE_WITH_CONCERNS

## Changes

- Created `server/db/client.js` with a single `pg.Pool` (explicit limits,
  5s connection timeout, 300s idle timeout), the `PrismaPg` adapter, the
  generated `.ts` client import, and the `prisma` singleton export.
- Implemented `disconnectDatabase()` as an idempotent cleanup that awaits
  `prisma.$disconnect()` before `pool.end()` (sequential per the Task 3
  progress ruling; pool stays available until Prisma teardown completes).
- Implemented `registerDatabase(app)` registering an `onClose` hook that
  awaits `disconnectDatabase()`.
- Modified `server/app.js` to import `registerDatabase` and call it right
  after the Fastify instance is created, before route registration. No
  `$connect()` call; the connection remains lazy.

## Verification

- `docker compose up -d postgres`: started.
- `npm run db:migrate`: already in sync, no pending migration.
- `node --test tests/db.test.mjs`: 3/3 pass (connection, CRUD/cascade,
  index).
- `node --test tests/server.test.mjs`: 7/7 pass (health, CORS, static,
  traversal blocking, JSON 404, error policy, SIGTERM clean exit).

## Concern

The worker environment's permission rules denied committing the
implementation files. The controller created this report and will commit the
unstaged Task 3 files (`server/app.js`, `server/db/`, `prisma/migrations/`)
before review.
