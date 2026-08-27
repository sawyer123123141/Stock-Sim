# Market Era Agent Guide

This file is the **cold-start context, handoff, and compaction protocol** for AI coding agents. Assume a new agent has zero chat history. Read this before changing code.

## 1. Project in one paragraph

Market Era is a colorful, beginner-friendly fictional stock/crypto strategy game built around one shared economy. A player who barely knows what a stock is should be able to play immediately, understand market movement through plain language and visual cues, and reveal deeper financial systems only when useful. The long-term fantasy grows toward a financial empire, but the MVP is deliberately small.

Do not turn it into professional trading software, a finance textbook, a casino, a company-management tycoon, a pile of unrelated minigames, a feature-count competition, or a generic AI dashboard.

## 2. Read order for a fresh agent

1. `AGENTS.md`
2. `README.md`
3. `docs/superpowers/specs/2026-08-26-market-era-design.md`
4. `docs/ui-reference-research.md`
5. `docs/mockups/2026-08-27-current-ui-direction.md`
6. the active file under `docs/superpowers/plans/`
7. relevant tests
8. relevant implementation files

Do not rely on chat history. The repository should contain enough context to reconstruct intent.

## 3. Source-of-truth order

When information conflicts:

1. latest explicit user decision;
2. safety/platform requirements;
3. approved master design spec;
4. reviewed current-state notes in this file;
5. active implementation plan;
6. README;
7. existing code behavior.

Existing code is evidence, not automatically the correct product decision.

### Known plan amendments

The first implementation plan was written before the reviewed prototype and is partly historical. In particular:

- examples using `changePct` should now use `lastTickChangePct` for the most recent simulation tick;
- tick behavior must receive explicit elapsed time (`deltaMs`); never assume every function call represents the same amount of market time;
- the project still uses Node's built-in test runner rather than the planned Vitest/Zod stack;
- Fastify and WebSocket dependencies are now available and the first authoritative runtime/server boundary is implemented on `feat/authoritative-market-runtime`;
- forecast/prediction ideas are not part of the current implementation. Do not add currency-staking or wagering mechanics. Any future forecast challenge must remain a non-wager learning/gameplay interaction and must comply with current safety requirements.

When a future plan replaces these decisions, update this section.

## 4. Non-negotiable product rules

- **Game first, finance underneath.**
- **Simple outside, deep inside.**
- A beginner who barely knows what a stock is must be able to play.
- Unlocks deepen existing flows before creating new tabs/buttons.
- **One general spendable currency: money.** Do not casually add gems, tickets, research coins, etc.
- Richer players gain abstraction and automation, not hundreds of chores.
- Stocks and crypto must behave meaningfully differently.
- Price movement must be explainable without becoming perfectly predictable.
- The live server is authoritative; clients never own canonical market/account state.
- The intended live game has one global fictional economy available 24/7.
- Real-player market influence is bounded; simulated liquidity prevents absurd coordinated moves.
- Future goals do not enter the MVP merely because they sound cool or are easy to code.
- No real-money wagering, cash-out, or currency-staking forecast systems.

## 5. Anti-slop feature gate

Before accepting a feature, ask:

- Does it strengthen `discover → understand → predict → invest → react`?
- Can a beginner understand it or safely ignore it?
- Can it fit an existing flow instead of adding permanent navigation?
- Does it create a decision rather than repetitive tapping?
- Does it scale without creating chores later?
- Is it actually required now?
- Can it remain a documented future goal instead?
- Can the UI show it without becoming more crowded?

If several answers are weak, simplify or defer it.

## 6. UI rule: references before code

Never begin a major production screen with a generic prompt like “make a stock dashboard.”

Before implementation:

1. define the screen's single main job;
2. define beginner-visible information;
3. define progressively revealed advanced information;
4. gather **2–4 concrete visual/product references** for that exact problem;
5. record what each contributes and what must not be copied;
6. make an information hierarchy/wireframe;
7. make a Market Era visual mockup;
8. review crowding, terminology, typography, spacing, motion, accessibility, and scaling;
9. only then implement production UI.

`docs/ui-reference-research.md` and `docs/mockups/2026-08-27-current-ui-direction.md` are mandatory for UI work.

Current reviewed direction:

- **market core credible, surrounding experience game-like**;
- Home / Market Overview is game-forward;
- Asset Detail is market-forward;
- the dense dark command-center prototype is a **midgame reference**, not the first-session UI;
- new players begin with only a few assets, a simple chart, price/change, one Buy/Sell path, one story/explanation, and one next goal;
- deeper timeframes, Top Movers, event markers, movement breakdowns, alerts, and advanced tools are progressively revealed inside familiar screens;
- do not add gems/shards/energy or other fake mobile-game currencies to manufacture game feel.

The exact theme is still subject to refinement. Do not mistake a neon treatment for the product identity.

## 7. Architecture

```text
apps/web/         Planned React + Vite client; display/input only.
apps/server/      Authoritative Fastify + WebSocket runtime.
packages/sim/     Pure deterministic market simulation engine.
packages/shared/  Shared domain/wire contracts.
tests/            Behavior, replay, transport, and lifecycle tests.
tools/            Small development/demo utilities only.
docs/             Research, specs, plans, and design constraints.
```

### Current implemented foundation

`packages/sim/` is intentionally independent of React, Fastify, databases, wall-clock globals, and `Math.random()`.

Pure simulation receives state, elapsed time, pressure, events, and RNG explicitly. The reviewed tick model uses:

- stock reference interval: 60 seconds;
- crypto reference interval: 5 seconds;
- deterministic drivers scaled linearly by elapsed time;
- random/noise movement scaled by the square root of elapsed time;
- momentum decay scaled by elapsed time as well;
- bounded per-tick safety ceilings;
- `lastTickChangePct` to avoid confusing one tick's movement with day/Era performance.

Do not make scheduling frequency secretly change game balance.

`apps/server/` now wraps the pure engine without moving game rules into infrastructure. The runtime owns its state and seeded RNG, advances only when time moves forward, can run from an injected or system scheduler, publishes snapshots to subscribers, and is coupled to Fastify listener lifecycle through `server.ts`.

The current transport boundary provides:

- `GET /api/market` for the current authoritative snapshot;
- `WS /ws/market` for the current snapshot on connection plus future authoritative updates.

The client remains display/input only. Future trade requests must express player intent to the server; clients must never assign canonical balances, holdings, or prices.

### Persistence boundary

Do **not** add the database yet. Accounts, portfolio state, trades, and persistence are intentionally deferred until the first in-memory Buy/Sell vertical slice proves the data model.

When persistence is introduced, keep it behind explicit store/repository interfaces so domain logic is not coupled directly to a database library.

### Technology direction

- TypeScript.
- Node.js 24 LTS preferred; current minimum `22.12`.
- React + Vite planned for desktop-first web UI.
- Fastify + `@fastify/websocket` + `ws` for the authoritative runtime/transport.
- Persistence/auth intentionally remain undecided until their subsystem is planned.

Do not add a database, ORM, UI framework, mobile wrapper, deployment platform, or state library merely because the project may need one eventually.

## 8. Important files

- `README.md` — concise human-facing status and scope.
- `AGENTS.md` — this cold-start guide and compaction protocol.
- `docs/superpowers/specs/2026-08-26-market-era-design.md` — approved product vision, MVP boundary, and future goals.
- `docs/ui-reference-research.md` — UI references and anti-slop research.
- `docs/mockups/2026-08-27-current-ui-direction.md` — latest visual hierarchy and progressive-disclosure checkpoint.
- `docs/superpowers/plans/2026-08-26-market-simulation-vertical-slice.md` — original first implementation plan; read the amendments above before following it literally.
- `packages/shared/src/market.ts` — market contracts.
- `packages/sim/src/rng.ts` — deterministic seeded random source.
- `packages/sim/src/fixtures.ts` — six small fictional seed assets for tests/demo.
- `packages/sim/src/demand.ts` — simulated pressure plus capped player influence.
- `packages/sim/src/events.ts` — target matching and event decay.
- `packages/sim/src/explain.ts` — ranks raw movement causes into plain-language reasons.
- `packages/sim/src/tick.ts` — reviewed, time-aware stock/crypto tick formulas.
- `packages/sim/src/market.ts` — advances a market and creates snapshots.
- `apps/server/src/marketRuntime.ts` — authoritative in-memory market owner, scheduler, and subscriber boundary.
- `apps/server/src/marketRoutes.ts` — HTTP/WebSocket market transport.
- `apps/server/src/app.ts` — Fastify app/plugin composition.
- `apps/server/src/server.ts` — couples listener lifecycle to runtime lifecycle.
- `apps/server/src/index.ts` — executable server entrypoint.
- `tests/*.test.mjs` — deterministic behavior/regression/server tests.
- `tools/demo.mjs` — console demonstration only, not gameplay.

Update this map when a new important directory would otherwise be ambiguous.

## 9. Before changing code

Inspect:

```bash
git status --short
git branch --show-current
git log --oneline -8
```

Then read the active plan/current state, search for existing types/functions, read relevant tests first, confirm the work is current MVP scope, and for UI work confirm the reference/mockup gate has passed.

Do not refactor unrelated code just because it annoys you aesthetically.

## 10. Testing discipline

For testable behavior:

1. write or adjust a failing regression test;
2. confirm it fails for the expected reason;
3. implement the smallest correct change;
4. run the focused test;
5. run the full relevant suite;
6. run type checking;
7. inspect the diff;
8. only then claim completion.

Current commands:

```bash
npm install
npm test
npm run typecheck
npm run demo
npm run start:server
```

GitHub Actions runs `npm install`, `npm test`, and `npm run typecheck` for pushes and pull requests. Use current CI evidence when a local development machine is unavailable.

Never claim a green suite from an earlier tree after changing code.

## 11. Git discipline

- Prefer an isolated feature/review branch for implementation.
- Make coherent commits.
- Push verified work promptly.
- Do not leave the only working copy in an ephemeral environment.
- Do not merge knowingly failing code.
- Before merge, compare the branch against `main` and verify there is no unrelated scope creep.

## 12. Context compaction / handoff protocol

Run this whenever context is about to be compacted, another agent will take over, a long work session ends, or a subsystem reaches a checkpoint.

Before handoff:

1. stop at a coherent boundary;
2. run current verification commands;
3. inspect `git status` and the diff;
4. update active-plan progress where practical;
5. update **Current State Snapshot** below with branch/commit, working behavior, verification evidence, blockers, and exact next task;
6. update README only if public setup/status changed;
7. update the master spec only for an approved product decision;
8. update UI research/current-direction docs only when reference evidence/rules changed;
9. commit the handoff updates;
10. push code and docs;
11. confirm the remote commit exists.

Fresh-agent resume:

1. read files in the order above;
2. check out/pull the canonical branch named below;
3. verify the recorded commit exists;
4. rerun the recorded verification before editing;
5. open the exact next task and relevant tests;
6. continue from repo/test evidence, not guesses about prior chat.

If this snapshot and git disagree, trust git/test evidence and repair the snapshot first.

## 13. Current State Snapshot

**Canonical merge target:** `main`

**Active implementation branch:** `feat/authoritative-market-runtime`

**Last verified implementation commit before handoff docs:** `3985dd21da8395e72bf08d7c008882eccaa5217e`

**Status:** The pure market engine now has a tested authoritative realtime server boundary. The branch is not yet merged into `main`.

**What works:**
- six fictional assets: three stocks and three crypto coins;
- deterministic seeded RNG and exact replay;
- distinct stock/crypto behavior;
- simulated pressure plus bounded player pressure;
- asset/sector/global events with decay;
- ranked beginner-readable movement reasons;
- elapsed-time-aware price movement and momentum;
- authoritative in-memory runtime with explicit clock/scheduler boundaries;
- runtime start/stop lifecycle and subscriber snapshots;
- Fastify HTTP snapshot endpoint;
- WebSocket current-snapshot + future-update stream;
- runnable server entrypoint and `npm run start:server` command;
- GitHub Actions verification for branches/PRs;
- console demo.

**Fresh verification evidence for implementation commit `3985dd21...`:**
- GitHub Actions CI run `33073433830`: PASS.
- Node suite: **18 tests passed, 0 failed**.
- TypeScript typecheck: PASS.
- HTTP, WebSocket, runtime scheduling, lifecycle, deterministic replay, timing, and movement regressions all pass in that run.

**Known limitations / intentional omissions:**
- no accounts, portfolio, Buy/Sell ledger, persistence, alerts, Era lifecycle, or leaderboards yet;
- no database or auth yet by design;
- no production web client yet;
- market pressure is not yet connected to player trade intent;
- server is a single-process authoritative foundation, not production horizontal scaling infrastructure;
- simulation constants are an initial game-tuning baseline, not final economy balance.

**Exact next engineering task after merge/review:** build the smallest early-game client/trading vertical slice. Start with shared trade/portfolio contracts and an in-memory server-owned portfolio/trade boundary, then connect a minimal React/Vite client to authoritative snapshots. Do not add persistence until the in-memory data model is proven.

**Exact next design task:** implement the simplified Stage-1 version described in `docs/mockups/2026-08-27-current-ui-direction.md`: minimal home/market shell + Nova Motors detail + live chart + one clear Buy/Sell path + cash/holdings + one plain-language explanation. Treat the dense command-center mockup as midgame, not onboarding.
