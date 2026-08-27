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

The original market-simulation plan is partly historical. Current amendments:

- examples using `changePct` should use `lastTickChangePct` for the most recent simulation tick;
- tick behavior receives explicit elapsed time (`deltaMs`); never assume every function call represents the same amount of market time;
- the project uses Node's built-in test runner rather than the originally proposed Vitest/Zod stack;
- Fastify and WebSocket dependencies are available; the authoritative runtime/server boundary was merged through PR #1;
- the first in-memory portfolio/trading slice was merged to `main` through PR #2 at `65f8aba9a4182e3f5c2b9e49a475b2e5577ad39f`;
- the Stage-1 client implementation is defined by `docs/superpowers/plans/2026-08-27-stage-1-web-client.md`;
- forecast/prediction ideas are not part of the current implementation. Do not add currency-staking or wagering mechanics. Any future forecast challenge must remain a non-wager learning/gameplay interaction and comply with current safety requirements.

When a future plan replaces these decisions, update this section.

## 4. Non-negotiable product rules

- **Game first, finance underneath.**
- **Simple outside, deep inside.**
- A beginner who barely knows what a stock is must be able to play.
- Unlocks deepen existing flows before creating new tabs/buttons.
- **One general spendable currency: money.** Do not casually add gems, tickets, research coins, energy, etc.
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
apps/web/         React + Vite first-playable client; display/input only.
apps/server/      Authoritative Fastify + WebSocket market/trading runtime.
packages/sim/     Pure deterministic market simulation engine.
packages/shared/  Shared domain/wire contracts.
tests/            Behavior, replay, transport, trading, and web regression tests.
tools/            Small development/demo utilities only.
docs/             Research, specs, plans, and design constraints.
```

### Pure simulation foundation

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

### Authoritative server boundary

`apps/server/` wraps the pure engine without moving game rules into infrastructure. The runtime owns market state and seeded RNG, advances only when time moves forward, publishes snapshots to subscribers, and is coupled to Fastify listener lifecycle through `server.ts`.

Current market transport:

- `GET /api/market` — current authoritative market snapshot;
- `WS /ws/market` — current snapshot on connection plus future authoritative updates;
- `GET /api/portfolio` — server-derived demo-player cash, holdings, and valuation;
- `POST /api/trades` — immediate fictional trade intent containing only `assetId`, `side`, and integer `quantity`.

The client never supplies canonical execution price, balance, holdings, or an arbitrary player ID.

### First trading rules

For the first playable:

- starting cash: exactly **$10,000.00 fictional money**;
- whole units only; no fractional shares/coins;
- immediate market orders only;
- no short selling;
- zero fees and zero spread;
- no margin, leverage, limit orders, stops, take-profit, pending orders, or direct transfers;
- canonical cash/cost basis uses integer cents;
- positions use aggregate average cost rather than exposed tax lots;
- rejected trades do not mutate portfolio state;
- per-player in-memory transactions serialize concurrent mutations;
- a queued trade captures authoritative price and execution time only when its transaction reaches the front of that queue;
- successful trades do **not** feed market pressure yet.

### Stage-1 client authority boundary

`apps/web/` is deliberately a display/input layer:

- initial market and portfolio come from server HTTP endpoints;
- subsequent market prices arrive over the authoritative WebSocket stream;
- chart history contains only authoritative snapshots received in the current browser session, capped at 120 samples per asset;
- trade requests submit only `assetId`, `side`, and whole-unit `quantity`;
- trade fills and canonical portfolio/accounting state come from the server;
- between trade responses, the browser may **project display valuation only** by combining canonical server holdings/cash with the latest authoritative market prices. This keeps displayed portfolio value and unrealized P/L live without making the browser authoritative.

Do not fabricate historical candles, balances, holdings, fills, or prices in the client.

### Persistence boundary

The current `PortfolioStore` is intentionally in memory and resets with the server. It exists behind a store interface so persistence can be replaced later without rewriting trading rules.

Do **not** add a database, ORM, migrations, or authentication casually. Plan persistence/account identity as its own subsystem once the client/trading data needs are concrete.

### Technology direction

- TypeScript.
- Node.js 24 LTS preferred; current minimum `22.12`.
- React + Vite for the desktop-first web UI.
- Fastify + `@fastify/websocket` + `ws` for the authoritative runtime/transport.
- Persistence/auth intentionally remain undecided until their subsystem is planned.

Do not add a database, ORM, UI framework, mobile wrapper, deployment platform, or state library merely because the project may need one eventually.

## 8. Important files

- `README.md` — concise human-facing status and setup.
- `AGENTS.md` — this cold-start guide and compaction protocol.
- `docs/superpowers/specs/2026-08-26-market-era-design.md` — approved product vision, MVP boundary, and future goals.
- `docs/ui-reference-research.md` — UI references and anti-slop research.
- `docs/mockups/2026-08-27-current-ui-direction.md` — latest visual hierarchy and progressive-disclosure checkpoint.
- `docs/superpowers/specs/2026-08-27-first-trading-slice-design.md` — first portfolio/trading rules and boundaries.
- `docs/superpowers/plans/2026-08-27-first-trading-slice.md` — server trading implementation plan.
- `docs/superpowers/plans/2026-08-27-stage-1-web-client.md` — current Stage-1 client implementation plan.
- `docs/superpowers/plans/2026-08-26-market-simulation-vertical-slice.md` — historical first market-engine plan; read amendments above before following literally.
- `packages/shared/src/market.ts` — market contracts.
- `packages/shared/src/trading.ts` — trade intent, fill, portfolio snapshot, and trading-error contracts.
- `packages/sim/src/` — deterministic market simulation.
- `apps/server/src/marketRuntime.ts` — authoritative in-memory market owner and subscriber boundary.
- `apps/server/src/marketRoutes.ts` — HTTP/WebSocket market transport.
- `apps/server/src/portfolioStore.ts` — transactional portfolio-store interface and in-memory implementation.
- `apps/server/src/tradingService.ts` — validation, accounting, fills, and server portfolio derivation.
- `apps/server/src/tradingRoutes.ts` — portfolio/trade HTTP transport and stable error mapping.
- `apps/server/src/server.ts` — listener/runtime lifecycle and default composition.
- `apps/web/src/api.ts` — browser HTTP/WebSocket transport.
- `apps/web/src/useMarketSession.ts` — Stage-1 market/portfolio/trade session state.
- `apps/web/src/portfolioProjection.ts` — display-only live portfolio valuation from canonical holdings + authoritative prices.
- `apps/web/src/components/PriceChart.tsx` — session-only authoritative chart rendering.
- `apps/web/src/components/TradeTicket.tsx` — whole-unit beginner Buy/Sell path.
- `apps/web/src/components/PositionCard.tsx` — selected position summary.
- `apps/web/src/components/MovementStory.tsx` — one top movement reason.
- `apps/web/src/components/NextObjective.tsx` — one beginner objective.
- `tests/*.test.mjs` — deterministic/server/trading/web regression suite.
- `tools/demo.mjs` — console demonstration only, not gameplay.

Update this map when a new important directory would otherwise be ambiguous.

## 9. Before changing code

Inspect branch/status/history first, then read the active plan/current state, search for existing types/functions, read relevant tests, confirm the work is current MVP scope, and for UI work confirm the reference/mockup gate has passed.

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
npm run dev:web
npm run build:web
```

`npm test` compiles the Node/shared TypeScript, runs Node behavior/regression tests, and runs the Vite production build. `npm run typecheck` checks both the Node/shared TypeScript project and the strict browser TypeScript project. GitHub Actions runs both gates.

Never claim a green suite from an earlier tree after changing code.

## 11. Git discipline

- Prefer an isolated feature/review branch for implementation.
- Make coherent commits.
- Push verified work promptly.
- Do not leave the only working copy in an ephemeral environment.
- Do not merge knowingly failing code.
- Before merge, compare the branch against `main` and verify there is no unrelated scope creep.
- Require fresh PR-triggered CI before merge, not only a previous push run.

## 12. Context compaction / handoff protocol

Run this whenever context is about to be compacted, another agent will take over, a long work session ends, or a subsystem reaches a checkpoint.

Before handoff:

1. stop at a coherent boundary;
2. run current verification commands;
3. inspect branch and diff;
4. update active-plan progress where practical;
5. update **Current State Snapshot** below with branch/commit, working behavior, verification evidence, blockers, and exact next task;
6. update README if public setup/status changed;
7. update the master spec only for an approved product decision;
8. update UI research/current-direction docs only when reference evidence/rules changed;
9. commit handoff updates;
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

**Current `main` before Stage-1 client integration:** `65f8aba9a4182e3f5c2b9e49a475b2e5577ad39f` (PR #2, first server-owned fictional trading slice)

**Active implementation branch:** `feat/stage1-web-client`

**Last behavior-changing implementation commit:** `31d87f112a89097ad863543ae26a0fe3023d19e7`

**Fresh implementation verification evidence:** GitHub Actions run `33087596429` on `31d87f...` completed successfully. Node suite: **40 tests passed, 0 failed**. `npm run build:web`: PASS (Vite production bundle). `npm run typecheck`: PASS for both the Node/shared and browser TypeScript projects.

**Status:** The simulation, realtime authoritative server, and server-owned fictional trading slice are merged to `main`. The Stage-1 first-playable React/Vite client is implementation-complete on `feat/stage1-web-client` and is at the integration gate: current-head docs CI, final branch comparison/review, pull-request CI, then merge. Do not assume it is merged without checking git/PR state.

**What works:**

- six fictional seed assets: three stocks and three crypto coins;
- deterministic seeded RNG and exact replay;
- distinct stock/crypto behavior;
- simulated pressure plus bounded player pressure;
- asset/sector/global events with decay;
- ranked beginner-readable movement reasons;
- elapsed-time-aware price movement and momentum;
- authoritative Fastify market runtime, HTTP snapshot endpoint, and WebSocket live stream;
- server-owned in-memory demo portfolio starting at $10,000;
- whole-unit immediate Buy/Sell at authoritative current price;
- integer-cent canonical cash/cost-basis accounting;
- no short selling, fees, or advanced orders;
- aggregate average-cost positions and server portfolio valuation;
- transactional per-player portfolio mutation and stable 4xx trade failures;
- React + Vite first-playable market client;
- up to five immediately visible assets with Nova Motors selected by default when present;
- live session-only price chart using received authoritative WebSocket snapshots, capped at 120 samples per asset;
- compact Market Era / Market Live header with cash and portfolio value;
- beginner whole-unit Buy/Sell ticket that submits intent only and exposes accessible grouped Buy/Sell controls;
- position card with owned units, average cost, market value, and unrealized P/L;
- displayed portfolio value and unrealized P/L stay live as authoritative WebSocket prices change via `portfolioProjection.ts`;
- one top plain-language “Why it moved” story with a direction-matching visual cue;
- one next objective instead of a wall of progression widgets;
- responsive layout, keyboard focus treatment, and reduced-motion support;
- Vite production build included in `npm test`;
- root typecheck includes the strict browser TypeScript project.

**Known limitations / intentional omissions:**

- portfolio state is in memory and resets on server restart;
- one configured demo player only; no real authentication/accounts yet;
- no database or ORM yet by design;
- chart history is browser-session-only; no persistent historical candles yet;
- no trade-history persistence or realized P/L reporting yet;
- no fees/spreads, fractional units, shorts, margin, leverage, limit orders, stops, or take-profit;
- successful player trades do not feed market pressure yet;
- no alerts, Era lifecycle, leaderboards, social layer, or company-control systems yet;
- server is a single-process authoritative foundation, not production horizontal scaling infrastructure;
- simulation constants are an initial game-tuning baseline, not final economy balance;
- current Stage-1 visual treatment is a first-playable foundation, not a declaration that the entire future product theme is locked.

**Exact next task after Stage-1 merge:** manually exercise the first playable as a user journey and choose the next narrow engineering slice from observed usability/gameplay gaps. Do not immediately add another major subsystem merely because the roadmap contains one.

**Exact design constraint:** keep the market core credible and the surrounding experience game-like. Preserve progressive disclosure, one-currency discipline, and the first-session focus. Do not reintroduce extra currencies, a primary Shop, fake chart history, or generic dashboard clutter.
