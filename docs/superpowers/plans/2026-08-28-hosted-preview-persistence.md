# Hosted preview persistence implementation plan

> **For Codex:** Execute this plan task by task, using test-driven development. The user has approved the architecture recorded in `docs/superpowers/specs/2026-08-28-hosted-preview-persistence-design.md`.

**Goal:** Ship the current playable on a Vercel preview with one persistent shared Supabase-backed market and demo portfolio, without changing gameplay contracts or UI design.

**Architecture:** A private Postgres row holds complete runtime recovery plus the one demo portfolio. An authority wrapper takes a `SELECT ... FOR UPDATE` transaction, restores the deterministic TypeScript runtime, replays five-second catch-up steps, and commits market/portfolio/trade-pressure state atomically. The client polls the existing public market endpoint.

**Tech Stack:** TypeScript, Fastify for local development, Vercel Node functions, Vite, Supabase Postgres transaction pooler, Postgres.js, Node test runner.

---

## File map

- Modify: `packages/sim/src/rng.ts` — expose deterministic seeded RNG recovery state without changing existing random behavior.
- Modify: `apps/server/src/playerPressure.ts` — import/export active impulses for recovery.
- Modify: `apps/server/src/marketRuntime.ts` — create/restore/export complete runtime recovery state and bounded advancing support.
- Create: `apps/server/src/gameAuthority.ts` — public-authority interface plus in-memory adapter.
- Create: `apps/server/src/persistentGameAuthority.ts` — transaction-owned recovery, catch-up, and atomic trades.
- Create: `apps/server/src/postgresGameStore.ts` — Postgres.js lock/read/write repository.
- Modify: `apps/server/src/portfolioStore.ts`, `apps/server/src/tradingService.ts`, route wiring — reuse existing TypeScript accounting inside the authority boundary.
- Modify: `apps/web/src/api.ts`, `apps/web/src/useMarketSession.ts` — polling subscription while retaining existing public contracts.
- Create: `api/market.ts`, `api/portfolio.ts`, `api/trades.ts`, `api/_authority.ts` — Vercel Node handlers.
- Create: `supabase/migrations/<timestamp>_create_game_state.sql` — private single-row durable state.
- Create: `vercel.json`, `.env.example` — deployment and non-secret configuration.
- Modify: `package.json`, `package-lock.json`, `README.md`, `AGENTS.md` — pinned runtime dependency and accurate hosted setup/handoff state.
- Create/modify: focused `tests/*.test.mjs` files for durable authority and polling behavior.

## Task 1: Capture recovery state in pure/runtime code

1. Add failing tests for restoring a seeded runtime after events and player trades, then producing the same next snapshot as uninterrupted execution.
2. Add failing tests for catch-up replaying distinct five-second ticks rather than one large tick.
3. Add a stateful seeded RNG companion API while preserving the existing random-source API.
4. Add pressure-book state import/export and runtime recovery import/export types; keep them server-only and outside public wire contracts.
5. Run focused tests and confirm the full suite remains green.

## Task 2: Add a lock-scoped game authority

1. Add failing tests using a serialized repository fake for concurrent reads/trades: the shared market advances once in order, two buys cannot overspend, and a sell cannot exceed its persisted position.
2. Define the small async authority interface used by HTTP handlers: market snapshot, portfolio snapshot, execute trade.
3. Implement an in-memory adapter so local Fastify uses the same endpoint surface.
4. Implement the persistent authority: transaction lock, restore, five-second catch-up, existing trade service invocation, persisted recovery/portfolio/trade id on one commit.
5. Add a Postgres.js repository that issues `SELECT ... FOR UPDATE` and parameterized JSON writes inside `sql.begin`, with `prepare: false`.
6. Run focused authority tests, then full suite.

## Task 3: Replace hosted live delivery with polling

1. Add a failing client transport test showing a five-second subscription fetches the existing market contract and cleanly stops on unsubscribe.
2. Implement polling behind the existing update-subscription shape; do not expose persistence fields or alter UI components.
3. Keep local Fastify WebSocket support unless its removal is necessary; Vercel handlers use the same authority with HTTP only.
4. Run focused web tests, `npm test`, and `npm run typecheck`.

## Task 4: Migrations and Vercel packaging

1. Add a version-controlled migration that creates a non-exposed `private.game_state` table, enables RLS, and seeds nothing secret.
2. Add Vercel handlers and config for the three existing API endpoints and Vite static output.
3. Add `.env.example` with `DATABASE_URL` only; update README to explain local in-memory mode and hosted secret configuration.
4. Apply the migration to the newly created `stock-sim-preview` Supabase project using the connected integration, inspect migrations, and run security/performance advisors.
5. Run `npm test`, `npm run typecheck`, `npm run build:web`, and `git diff --check`.

## Task 5: Deploy, review, and integrate

1. Review the complete diff for UI/gameplay drift, authority leaks, transaction safety, recovery completeness, and secrets.
2. Commit coherent changes, push `codex/persistent-preview`, and open a PR to `main`.
3. Configure the server-only transaction-pooler `DATABASE_URL` through the Vercel/Supabase integration; never place it in the repository or a client variable.
4. Deploy a preview and check cold start, two sessions, refresh persistence, trade persistence, invalid rejection, market catch-up, hidden-state absence, and runtime/build logs.
5. Wait for fresh exact-head pull-request CI. If green, merge only this PR, sync local `main`, and wait for exact post-merge CI.
