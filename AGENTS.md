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
5. the active file under `docs/superpowers/plans/`
6. relevant tests
7. relevant implementation files

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
- the current dependency-free prototype uses Node's built-in test runner rather than the planned Vitest/Zod/Fastify stack because external dependencies could not be installed in the original execution environment;
- the plan's provisional “non-wager only” prediction note does **not** override the approved master spec. If predictions are implemented later, they may use **fictional in-game money only**, must have no real-money purchase/cash-out connection, and must remain secondary to the market/investing loop.

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
- The intended live server is authoritative; clients never own canonical market/account state.
- The intended live game has one global fictional economy available 24/7.
- Real-player market influence is bounded; simulated liquidity prevents absurd coordinated moves.
- Future goals do not enter the MVP merely because they sound cool or are easy to code.
- No real-money wagering or cash-out systems.

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

`docs/ui-reference-research.md` is mandatory for UI work. The first planned screen is **Market Overview**. The visual identity is colorful business-cartoon, not a black trading terminal and not a childish learning app.

## 7. Architecture

```text
apps/web/         Planned React + Vite client; display/input only.
apps/server/      Planned authoritative Fastify + WebSocket runtime.
packages/sim/     Pure deterministic market simulation engine.
packages/shared/  Shared domain/wire contracts.
tests/            Behavior and replay tests.
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

### Technology direction

- TypeScript.
- Node.js 24 LTS preferred; current minimum `22.12`.
- React + Vite planned for desktop-first web UI.
- Fastify + WebSockets planned for the authoritative runtime.
- Persistence/auth intentionally remain undecided until their subsystem is planned.

Do not add a database, ORM, UI framework, mobile wrapper, deployment platform, or state library merely because the project may need one eventually.

## 8. Important files

- `README.md` — concise human-facing status and scope.
- `AGENTS.md` — this cold-start guide and compaction protocol.
- `docs/superpowers/specs/2026-08-26-market-era-design.md` — approved product vision, MVP boundary, and future goals.
- `docs/ui-reference-research.md` — UI references, anti-slop rules, and Market Overview brief.
- `docs/superpowers/plans/2026-08-26-market-simulation-vertical-slice.md` — original first implementation plan; read the amendments above before following it literally.
- `packages/shared/src/market.ts` — market contracts.
- `packages/sim/src/rng.ts` — deterministic seeded random source.
- `packages/sim/src/fixtures.ts` — six small fictional seed assets for tests/demo.
- `packages/sim/src/demand.ts` — simulated pressure plus capped player influence.
- `packages/sim/src/events.ts` — target matching and event decay.
- `packages/sim/src/explain.ts` — ranks raw movement causes into plain-language reasons.
- `packages/sim/src/tick.ts` — reviewed, time-aware stock/crypto tick formulas.
- `packages/sim/src/market.ts` — advances a market and creates snapshots.
- `tests/*.test.mjs` — deterministic behavior/regression tests.
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

Current pure-engine commands:

```bash
npm test
npm run typecheck
npm run demo
```

If dependencies are unavailable, the verified fallback used for this prototype is:

```bash
tsc -p tsconfig.json
node --test tests/*.test.mjs
node tools/demo.mjs
```

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
8. update UI research only when reference evidence/rules changed;
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

**Canonical branch after merge:** `main`

**Reviewed implementation branch:** `review/market-sim-time-scaling-clean`

**Last locally verified reviewed code:** `7fb5d50a917ca5c702fbc1449e9f5ad34e79e342`

**Status:** The smallest pure market-simulation prototype exists and has completed a pre-merge timing/semantics review.

**What works:**
- six fictional assets: three stocks and three crypto coins;
- deterministic seeded RNG and exact replay;
- distinct stock/crypto behavior;
- simulated pressure plus bounded player pressure;
- asset/sector/global events with decay;
- ranked beginner-readable movement reasons;
- elapsed-time-aware price movement and momentum;
- explicit last-tick percentage semantics;
- console demo.

**Fresh verification evidence:**
- TypeScript compilation: PASS.
- Node suite: **11 tests passed, 0 failed**.
- Added merge-review regressions for tick-duration scaling, one-day runaway drift, and zero-time momentum stability.
- Demo executes successfully after the review fixes.

**Known limitations / intentional omissions:**
- no authoritative Fastify/WebSocket runtime yet;
- no accounts, portfolio, buy/sell ledger, persistence, alerts, Era lifecycle, or leaderboards yet;
- no production UI yet;
- external dependency/server work from the original plan remains unverified and unimplemented;
- simulation constants are an initial game-tuning baseline, not final economy balance.

**Next engineering task:** wrap the pure engine in an authoritative realtime server only after dependencies can be installed and tested. Re-read the active plan, this file's amendments, `packages/sim/src/index.ts`, and replay/timing tests first.

**Next design task:** turn the Market Overview brief in `docs/ui-reference-research.md` into a reviewed visual desktop mockup before production UI code.
