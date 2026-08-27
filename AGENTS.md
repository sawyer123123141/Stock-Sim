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
6. the relevant file under `docs/superpowers/plans/`
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

- `changePct` was replaced by `lastTickChangePct` for the most recent simulation tick.
- Tick behavior receives explicit elapsed time (`deltaMs`); never make scheduler frequency secretly change game balance.
- The project uses Node's built-in test runner rather than the originally proposed Vitest/Zod stack.
- The authoritative runtime/server boundary merged through PR #1.
- The first in-memory portfolio/trading slice merged through PR #2 at `65f8aba9a4182e3f5c2b9e49a475b2e5577ad39f`.
- The Stage-1 React/Vite client merged through PR #3 at `4b5b67b5ef0bb6d8e105e152b20e931dea8db46c`.
- Stage 1.1 first-session polish merged through PR #4 at `59c6f7dbbf4a298d3374159d3493375de08a3603`.
- Forecast/prediction ideas are not part of the current implementation. Do not add currency-staking or wagering mechanics.

## 4. Non-negotiable product rules

- **Game first, finance underneath.**
- **Simple outside, deep inside.**
- A beginner who barely knows what a stock is must be able to play.
- Unlocks deepen existing flows before creating new tabs/buttons.
- **One general spendable currency: money.** Do not add gems, tickets, research coins, energy, etc.
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

## 6. UI direction and mandatory design gate

Never begin a major production screen from a generic prompt such as “make a stock dashboard.” Before substantial UI implementation:

1. define the screen's single main job;
2. define what a beginner sees immediately;
3. define what deeper information is progressively revealed later;
4. gather **2–4 concrete visual/product references** for that exact problem;
5. record what each reference contributes and what must not be copied;
6. make an information hierarchy or wireframe;
7. make a Market Era visual mockup/prototype when the change is visually substantial;
8. review crowding, terminology, typography, spacing, motion, accessibility, and scaling;
9. only then implement the production screen.

`docs/ui-reference-research.md` and `docs/mockups/2026-08-27-current-ui-direction.md` are mandatory reading for major UI work. A small polish fix that does not change the information architecture does not require restarting the entire design process.

Current reviewed direction:

- **market core credible, surrounding experience game-like**;
- Home / Market Overview is game-forward;
- Asset Detail is market-forward;
- the dense dark command-center prototype is a **midgame reference**, not the first-session UI;
- new players begin with only a few assets, a simple chart, price/change, one Buy/Sell path, one story/explanation, and one next goal;
- deeper timeframes, Top Movers, event markers, movement breakdowns, alerts, and advanced tools are progressively revealed inside familiar screens;
- do not add gems/shards/energy or other fake mobile-game currencies to manufacture game feel;
- the exact visual theme is still subject to refinement. Do not mistake neon treatment for the product identity.

Stage 1.1 reinforces progressive disclosure:

- no empty Position card before the selected asset is owned;
- successful trades show a small authoritative fill receipt instead of reward spectacle;
- first-session objectives form a tiny sequence and do not regress after selling an asset during the same browser session;
- the chart never fabricates a second history point merely to draw a line;
- live quote motion is restrained and respects reduced-motion preferences.

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

`packages/sim/` is independent of React, Fastify, databases, wall-clock globals, and hidden `Math.random()` calls.

Reviewed timing model:

- stock reference interval: 60 seconds;
- crypto reference interval: 5 seconds;
- deterministic drivers scale linearly with elapsed time;
- random/noise movement scales by square root of elapsed time;
- momentum decay is elapsed-time aware;
- bounded per-tick safety ceilings;
- `lastTickChangePct` represents only the latest simulation tick.

### Authoritative server boundary

Current transport:

- `GET /api/market` — current authoritative market snapshot;
- `WS /ws/market` — current snapshot on connection plus future authoritative updates;
- `GET /api/portfolio` — server-derived demo-player cash, holdings, and valuation;
- `POST /api/trades` — immediate fictional trade intent containing only `assetId`, `side`, and integer `quantity`.

The client never supplies canonical execution price, balance, holdings, or arbitrary player ID.

### First trading rules

For the first playable:

- starting cash: exactly **$10,000.00 fictional money**;
- whole units only;
- immediate market orders only;
- no short selling;
- zero fees and zero spread;
- no margin, leverage, limit orders, stops, take-profit, pending orders, or direct transfers;
- canonical cash/cost basis uses integer cents;
- positions use aggregate average cost;
- rejected trades do not mutate portfolio state;
- per-player in-memory transactions serialize concurrent mutations;
- queued trades capture authoritative price/time when the transaction actually executes;
- successful trades do **not** feed market pressure yet.

### Stage-1 client authority boundary

`apps/web/` is deliberately a display/input layer:

- initial market and portfolio come from server HTTP endpoints;
- subsequent prices arrive over the authoritative WebSocket stream;
- chart history contains only authoritative snapshots received in the current browser session, capped at 120 samples per asset;
- the chart may show a single real point while waiting, but must not fabricate history;
- trade requests submit only `assetId`, `side`, and whole-unit `quantity`;
- trade receipts use the `TradeFill` returned by the server;
- canonical portfolio/accounting state comes from the server;
- the browser may project **display valuation only** by combining canonical holdings/cash with the latest authoritative market prices;
- first-session objective memory is ephemeral UI guidance only. It is not account state and does not grant money or unlock canonical systems.

Do not fabricate historical candles, balances, holdings, fills, or prices in the client.

### Persistence boundary

`PortfolioStore` is intentionally in memory and resets with the server. It exists behind a store interface so persistence can be replaced later without rewriting trading rules.

Do **not** add a database, ORM, migrations, or authentication casually. Plan persistence/account identity as its own subsystem once concrete requirements justify it.

### Technology direction

- TypeScript.
- Node.js 24 LTS preferred; minimum `22.12`.
- React + Vite desktop-first web UI.
- Fastify + `@fastify/websocket` + `ws` authoritative runtime/transport.
- Persistence/auth intentionally undecided.

Do not add a database, ORM, UI framework, mobile wrapper, deployment platform, or state library merely because the project may need one eventually.

## 8. Important files

- `README.md` — concise human-facing status and setup.
- `AGENTS.md` — this cold-start guide and handoff protocol.
- `docs/superpowers/specs/2026-08-26-market-era-design.md` — approved product vision/MVP boundary.
- `docs/ui-reference-research.md` — UI references and anti-slop research.
- `docs/mockups/2026-08-27-current-ui-direction.md` — latest hierarchy/progressive-disclosure checkpoint.
- `docs/superpowers/specs/2026-08-27-first-trading-slice-design.md` — first portfolio/trading rules.
- `docs/superpowers/plans/2026-08-27-first-trading-slice.md` — server trading plan.
- `docs/superpowers/plans/2026-08-27-stage-1-web-client.md` — Stage-1 client plan.
- `packages/shared/src/market.ts` — market contracts.
- `packages/shared/src/trading.ts` — trading/portfolio contracts.
- `packages/sim/src/` — deterministic market simulation.
- `apps/server/src/marketRuntime.ts` — authoritative in-memory market owner.
- `apps/server/src/marketRoutes.ts` — HTTP/WebSocket market transport.
- `apps/server/src/portfolioStore.ts` — portfolio store interface + in-memory implementation.
- `apps/server/src/tradingService.ts` — validation/accounting/fills.
- `apps/server/src/tradingRoutes.ts` — portfolio/trade HTTP transport.
- `apps/server/src/server.ts` — listener/runtime lifecycle.
- `apps/web/src/api.ts` — browser HTTP/WebSocket transport.
- `apps/web/src/useMarketSession.ts` — market/portfolio/trade session state and ephemeral beginner progress.
- `apps/web/src/portfolioProjection.ts` — display-only live valuation.
- `apps/web/src/firstSessionProgress.ts` — duplicate-free, non-regressing session objective memory.
- `apps/web/src/components/PriceChart.tsx` — honest session-only chart rendering.
- `apps/web/src/components/TradeTicket.tsx` — whole-unit Buy/Sell + authoritative fill receipt.
- `apps/web/src/components/PositionCard.tsx` — selected owned-position summary.
- `apps/web/src/components/MovementStory.tsx` — one top movement reason.
- `apps/web/src/components/NextObjective.tsx` — one beginner objective at a time.
- `tests/*.test.mjs` — deterministic/server/trading/web regression suite.

## 9. Testing discipline

For testable behavior:

1. write/adjust a failing regression test;
2. confirm it fails for the expected reason;
3. implement the smallest correct change;
4. run focused verification;
5. run the full suite;
6. run type checking;
7. inspect the diff;
8. only then claim completion.

Commands:

```bash
npm install
npm test
npm run typecheck
npm run demo
npm run start:server
npm run dev:web
npm run build:web
```

`npm test` compiles Node/shared TypeScript, runs Node behavior/regression tests, and builds the Vite production client. `npm run typecheck` checks both Node/shared and browser TypeScript projects. GitHub Actions runs both gates.

Never claim a green suite from an earlier tree after changing code.

## 10. Git discipline

- Prefer an isolated feature/review branch.
- Make coherent commits.
- Do not merge knowingly failing code.
- Before merge, compare branch against `main` and inspect the actual patch.
- Require fresh PR-triggered CI before merge, not only push CI.
- Do not claim a merge is complete until the merge commit exists.

## 11. Context compaction / handoff protocol

Use this whenever a long work session ends, another agent may take over, context is about to be compacted, or a subsystem reaches a checkpoint.

Before handoff:

1. stop at a coherent boundary;
2. run current verification commands on the actual head;
3. inspect branch status and diff;
4. update plan progress when useful;
5. update the Current State Snapshot with branch/commit, working behavior, verification evidence, blockers, and exact next task;
6. update README when public setup/status changed;
7. update the master spec only for an approved product decision;
8. commit/push the handoff changes;
9. confirm the remote head exists.

Fresh-agent resume:

1. read the repository in the order listed above;
2. inspect the canonical branch and any active branch recorded below;
3. verify the recorded commits exist;
4. rerun current verification before editing;
5. continue from repository/test evidence rather than guesses about old chat context.

If this snapshot and git disagree, trust git/test evidence and repair the snapshot.

## 12. Current State Snapshot

**Canonical merge target:** `main`

**Current `main` implementation merge:** `59c6f7dbbf4a298d3374159d3493375de08a3603` (PR #4, Stage 1.1 first-session polish)

**Active implementation branch:** none. Start future feature work from current `main` on a fresh branch.

**Last behavior-changing implementation commit:** `041081852b5c621f88da6c7f685cf3b9018ab9a5` (contained in PR #4 / the merge above).

**Fresh post-merge verification:** GitHub Actions run `33114133521` on merge commit `59c6f7db...` completed successfully. **43 tests passed, 0 failed**. Vite production build: PASS. `npm run typecheck`: PASS for Node/shared and browser TypeScript.

**Stage 1.1 behavior now on `main`:**

- hides the empty Position card until the selected asset is owned;
- shows a compact successful-trade receipt sourced from the authoritative `TradeFill`;
- keeps a small first-session objective sequence from regressing after a sale by remembering previously owned asset IDs for the browser session only;
- does not fabricate a second chart point while live history is still collecting;
- applies a restrained quote tick pulse on the live market cadence;
- preserves all existing server authority boundaries and one-currency rules.

**Intentional limitations:**

- portfolio state resets on server restart;
- one configured demo player; no authentication/accounts;
- no database/ORM;
- chart history remains browser-session-only;
- first-session objective memory is also browser-session-only;
- no persistent trade history/realized P/L;
- no fees/spreads, fractions, shorts, margin, leverage, advanced orders, or alerts;
- player trades do not yet feed market pressure;
- no Era lifecycle, leaderboards/social, or company-control systems;
- current visual treatment is a first-playable foundation, not a locked final theme.

**Integration status:** Stage 1.1 is merged through PR #4 and post-merge `main` CI is green. There is no unfinished implementation branch that must be preserved for the next feature.

**Exact next product task:** manually exercise the first playable as a user journey on a real screen and use observed friction to choose the next narrow engineering slice. Do not immediately add another major subsystem just because it exists on the roadmap.

**Exact next collaboration mode:** when Codex is used for implementation, treat this repository handoff plus explicit design decisions from the conversation as the source of truth. Keep implementation work on focused branches; use ChatGPT for product/design decisions, architecture review, scope control, and review of Codex results before merge.

**Exact design constraint:** keep the market core credible and the surrounding experience game-like. Preserve progressive disclosure, one-currency discipline, and first-session focus. Do not reintroduce extra currencies, a primary Shop, fake chart history, or generic dashboard clutter.
