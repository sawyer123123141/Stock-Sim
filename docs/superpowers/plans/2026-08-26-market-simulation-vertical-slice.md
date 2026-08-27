# Market Simulation Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the smallest deterministic, explainable stock/crypto simulation that can run continuously on an authoritative server and be tested without any UI.

**Architecture:** Use an npm-workspaces TypeScript monorepo. Keep the market engine pure and deterministic in `packages/sim`; shared wire/domain contracts live in `packages/shared`; `apps/server` owns realtime execution and exposes read-only HTTP/WebSocket snapshots. The first vertical slice deliberately excludes accounts, portfolios, persistence, leaderboards, mobile, company control, and production UI.

**Tech Stack:** Node.js 24 LTS, npm workspaces, TypeScript, Zod, Vitest, Fastify, `@fastify/websocket`.

**Spec:** `docs/superpowers/specs/2026-08-26-market-era-design.md`

## Global Constraints

- Game first, finance underneath.
- A player with almost no stock knowledge must eventually be able to understand the output.
- Stocks and crypto must feel meaningfully different.
- Market movement must be explainable but not perfectly deterministic to a player.
- The simulation is server-authoritative.
- There is one global fictional economy.
- The exchange is available 24/7.
- Stocks use slower major ticks; crypto uses faster ticks.
- Real-player demand is bounded and simulated liquidity remains dominant enough to prevent absurd manipulation.
- MVP scope is protected. Do not implement post-MVP company control, acquisitions, holding companies, deep macroeconomics, or a complete mobile client.
- Do not add a wagering system. If short-term forecasting is prototyped later for this project, use non-wager forecast challenges rather than a gambling mechanic.
- No production UI work begins until the screen passes `docs/ui-reference-research.md`.

---

## File Structure Locked By This Plan

```text
Stock-Sim/
├─ package.json                     # npm workspace commands and Node engine
├─ tsconfig.base.json               # shared strict TypeScript settings
├─ .gitignore                       # Node/build/local-env ignores
├─ apps/
│  └─ server/
│     ├─ package.json               # authoritative server package
│     ├─ tsconfig.json
│     └─ src/
│        ├─ app.ts                  # builds Fastify app; no listen side effect
│        ├─ index.ts                # process entrypoint and graceful shutdown
│        ├─ marketRuntime.ts        # owns current MarketState and timers
│        └─ marketRoutes.ts         # HTTP snapshot + WebSocket snapshot stream
├─ packages/
│  ├─ shared/
│  │  ├─ package.json
│  │  ├─ tsconfig.json
│  │  └─ src/
│  │     ├─ market.ts               # public market contracts and Zod schemas
│  │     └─ index.ts                # public exports only
│  └─ sim/
│     ├─ package.json
│     ├─ tsconfig.json
│     └─ src/
│        ├─ rng.ts                  # deterministic seeded RNG
│        ├─ fixtures.ts             # small hand-authored fictional seed market
│        ├─ demand.ts               # simulated investor + bounded player pressure
│        ├─ events.ts               # event effects with decay
│        ├─ tick.ts                 # pure stock/crypto tick functions
│        ├─ explain.ts              # ranked plain-language movement reasons
│        └─ index.ts                # package public API
└─ tests/
   ├─ sim/
   │  ├─ rng.test.ts
   │  ├─ stock-tick.test.ts
   │  ├─ crypto-tick.test.ts
   │  ├─ demand.test.ts
   │  ├─ events.test.ts
   │  └─ deterministic-replay.test.ts
   └─ server/
      └─ market-api.test.ts
```

No `packages/ui`, database layer, auth layer, or deployment config is created in this plan. Those need their own reviewed plans.

---

### Task 1: Scaffold the TypeScript workspace

**Files:**
- Create: `package.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/sim/package.json`
- Create: `packages/sim/tsconfig.json`
- Create: `apps/server/package.json`
- Create: `apps/server/tsconfig.json`

**Interfaces:**
- Produces workspace packages named `@market-era/shared`, `@market-era/sim`, and `@market-era/server`.
- All later tasks use root scripts `test`, `typecheck`, and `dev:server`.

- [ ] **Step 1: Create the root workspace manifest**

```json
{
  "name": "market-era",
  "private": true,
  "version": "0.0.0",
  "engines": { "node": ">=24 <25" },
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc -b --pretty false",
    "dev:server": "npm run dev -w @market-era/server"
  },
  "devDependencies": {
    "@types/node": "latest",
    "tsx": "latest",
    "typescript": "latest",
    "vitest": "latest"
  }
}
```

- [ ] **Step 2: Add strict shared compiler settings**

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "declaration": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

- [ ] **Step 3: Add package manifests and project references**

`packages/shared/package.json` exports `./src/index.ts`; `packages/sim/package.json` depends on `@market-era/shared`; `apps/server/package.json` depends on both workspace packages plus `fastify`, `@fastify/websocket`, and `zod`. Each package uses `"type": "module"` and has a `tsconfig.json` extending the root config with `composite: true`.

- [ ] **Step 4: Install dependencies and verify the empty workspace typechecks**

Run:
```bash
npm install
npm run typecheck
```
Expected: TypeScript completes with exit code 0.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json tsconfig.base.json .gitignore apps packages
git commit -m "chore: scaffold market simulation workspace"
```

---

### Task 2: Define shared market contracts

**Files:**
- Create: `packages/shared/src/market.ts`
- Create: `packages/shared/src/index.ts`
- Create: `tests/sim/contracts.test.ts`

**Interfaces:**
- Produces `Asset`, `AssetKind`, `MarketState`, `MarketEvent`, `MarketPressure`, `MovementReason`, and `MarketSnapshot` types.
- Produces `marketSnapshotSchema` for runtime validation at server boundaries.

- [ ] **Step 1: Write the failing contract test**

```ts
import { describe, expect, it } from 'vitest';
import { marketSnapshotSchema } from '../../packages/shared/src/index.js';

describe('marketSnapshotSchema', () => {
  it('accepts a minimal valid market snapshot', () => {
    const parsed = marketSnapshotSchema.parse({
      sequence: 1,
      generatedAt: '2026-08-26T00:00:00.000Z',
      assets: [{ id: 'nova', symbol: 'NOVA', name: 'Nova Motors', kind: 'stock', price: 42.18, changePct: 3.2, reasons: [] }]
    });
    expect(parsed.assets[0]?.symbol).toBe('NOVA');
  });
});
```

- [ ] **Step 2: Run it and verify failure**

Run:
```bash
npm test -- tests/sim/contracts.test.ts
```
Expected: FAIL because `packages/shared/src/index.ts` does not exist.

- [ ] **Step 3: Implement the contracts with Zod-backed schemas**

Use string IDs rather than numeric database IDs. Prices are positive finite numbers. `changePct` is a percentage-point number such as `3.2` for 3.2%. A `MovementReason` contains `code`, `label`, `direction`, `weight`, and a beginner-facing `summary`.

- [ ] **Step 4: Run tests and typecheck**

```bash
npm test -- tests/sim/contracts.test.ts
npm run typecheck
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/shared tests/sim/contracts.test.ts
git commit -m "feat: define shared market contracts"
```

---

### Task 3: Add deterministic randomness and seed fixtures

**Files:**
- Create: `packages/sim/src/rng.ts`
- Create: `packages/sim/src/fixtures.ts`
- Create: `tests/sim/rng.test.ts`

**Interfaces:**
- Produces `createSeededRng(seed: number): () => number` returning values in `[0, 1)`.
- Produces `createSeedMarket(): MarketState` with at least three stocks and three coins.

- [ ] **Step 1: Write the deterministic RNG test**

```ts
import { describe, expect, it } from 'vitest';
import { createSeededRng } from '../../packages/sim/src/rng.js';

it('replays the same sequence for the same seed', () => {
  const a = createSeededRng(12345);
  const b = createSeededRng(12345);
  expect([a(), a(), a()]).toEqual([b(), b(), b()]);
});
```

- [ ] **Step 2: Verify failure**

```bash
npm test -- tests/sim/rng.test.ts
```
Expected: FAIL because `createSeededRng` is missing.

- [ ] **Step 3: Implement a small deterministic PRNG and hand-authored fixtures**

Use Mulberry32 or an equivalently small deterministic algorithm. Fixtures must be obviously fictional and include different baseline volatility/strength/sentiment so the engine has meaningful variety without procedural generation.

- [ ] **Step 4: Verify**

```bash
npm test -- tests/sim/rng.test.ts
npm run typecheck
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/sim/src/rng.ts packages/sim/src/fixtures.ts tests/sim/rng.test.ts
git commit -m "feat: add deterministic market fixtures"
```

---

### Task 4: Implement bounded demand pressure

**Files:**
- Create: `packages/sim/src/demand.ts`
- Create: `tests/sim/demand.test.ts`

**Interfaces:**
- Consumes `MarketPressure`.
- Produces `calculateDemandPressure(input): number` where the output is clamped to `[-1, 1]`.
- Simulated demand remains the dominant component; player demand contributes at most 25% of the pre-event pressure in this first slice.

- [ ] **Step 1: Write tests for normal, extreme, and symmetric pressure**

```ts
it('bounds extreme player pressure', () => {
  expect(calculateDemandPressure({ simulated: 0, player: 999 })).toBeLessThanOrEqual(0.25);
});

it('lets simulated demand dominate', () => {
  expect(calculateDemandPressure({ simulated: 0.8, player: -999 })).toBeGreaterThan(0.3);
});
```

- [ ] **Step 2: Verify failure**

```bash
npm test -- tests/sim/demand.test.ts
```
Expected: FAIL because `calculateDemandPressure` is missing.

- [ ] **Step 3: Implement the minimal bounded formula**

Normalize `simulated` to `[-1, 1]`, normalize player input through `tanh`, multiply the player component by `0.25`, combine, then clamp the final result to `[-1, 1]`.

- [ ] **Step 4: Verify**

```bash
npm test -- tests/sim/demand.test.ts
npm run typecheck
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/sim/src/demand.ts tests/sim/demand.test.ts
git commit -m "feat: bound player market pressure"
```

---

### Task 5: Implement event effects and decay

**Files:**
- Create: `packages/sim/src/events.ts`
- Create: `tests/sim/events.test.ts`

**Interfaces:**
- Produces `eventEffectForAsset(event, asset, nowMs): number` in `[-1, 1]`.
- Event effects may target an asset, a sector, or all assets and decay linearly to zero by `expiresAt`.

- [ ] **Step 1: Write tests**

Test that a positive targeted event affects its asset, does not affect an unrelated asset, and reaches zero at expiration.

- [ ] **Step 2: Verify failure**

```bash
npm test -- tests/sim/events.test.ts
```
Expected: FAIL because the event module is missing.

- [ ] **Step 3: Implement event matching and decay**

Avoid event-template generation in this task. The engine receives already-authored event objects and only computes their current influence.

- [ ] **Step 4: Verify**

```bash
npm test -- tests/sim/events.test.ts
npm run typecheck
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/sim/src/events.ts tests/sim/events.test.ts
git commit -m "feat: add decaying market event effects"
```

---

### Task 6: Implement stock and crypto tick functions

**Files:**
- Create: `packages/sim/src/tick.ts`
- Create: `tests/sim/stock-tick.test.ts`
- Create: `tests/sim/crypto-tick.test.ts`

**Interfaces:**
- Produces `tickAsset(asset, context, rng): AssetTickResult`.
- `AssetTickResult` contains the next asset state plus raw factor contributions used by the explanation layer.
- Stock formula weights company strength and sector conditions more heavily.
- Crypto formula weights momentum, sentiment, and volatility more heavily.

- [ ] **Step 1: Write a stock behavior test**

For a stock with strong fundamentals, positive sector trend, positive demand, and a fixed RNG sequence, assert that its next price is above its starting price and that its absolute tick move remains below the configured stock safety ceiling.

- [ ] **Step 2: Write a crypto differentiation test**

Given identical sentiment/demand inputs and equivalent baseline price, assert across a fixed 100-tick replay that the crypto asset's average absolute return is greater than the stock asset's.

- [ ] **Step 3: Verify both tests fail**

```bash
npm test -- tests/sim/stock-tick.test.ts tests/sim/crypto-tick.test.ts
```
Expected: FAIL because `tickAsset` is missing.

- [ ] **Step 4: Implement the smallest weighted formulas**

For stocks, combine normalized company strength, sector trend, sentiment, momentum, demand, event effect, and low-amplitude seeded noise. For crypto, omit company-strength weighting and increase the weights of sentiment, momentum, demand, and noise. Clamp per-tick returns so one tick cannot create absurd prices. Keep all constants named and colocated at the top of `tick.ts`.

- [ ] **Step 5: Verify tests and typecheck**

```bash
npm test -- tests/sim/stock-tick.test.ts tests/sim/crypto-tick.test.ts
npm run typecheck
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/sim/src/tick.ts tests/sim/stock-tick.test.ts tests/sim/crypto-tick.test.ts
git commit -m "feat: simulate distinct stock and crypto ticks"
```

---

### Task 7: Add plain-language movement explanations

**Files:**
- Create: `packages/sim/src/explain.ts`
- Modify: `packages/sim/src/tick.ts`
- Create: `tests/sim/explain.test.ts`

**Interfaces:**
- Produces `explainMovement(contributions): MovementReason[]` sorted by absolute influence.
- Beginner summaries must use plain language such as `Positive company news is attracting investors`, not unexplained metric names.

- [ ] **Step 1: Write the failing explanation test**

Create contributions where news is the strongest positive driver and sector trend is weaker. Assert that the first reason code is `news`, direction is `up`, and `summary` contains no abbreviations such as `P/E`, `RSI`, or `EPS`.

- [ ] **Step 2: Verify failure**

```bash
npm test -- tests/sim/explain.test.ts
```
Expected: FAIL because `explainMovement` is missing.

- [ ] **Step 3: Implement ranked explanations**

Return no more than three reasons. Drop negligible contributions. Keep reason labels stable because later UI and analytics will rely on the reason codes.

- [ ] **Step 4: Verify**

```bash
npm test -- tests/sim/explain.test.ts
npm run typecheck
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/sim/src/explain.ts packages/sim/src/tick.ts tests/sim/explain.test.ts
git commit -m "feat: explain simulated price movement"
```

---

### Task 8: Prove deterministic replay

**Files:**
- Create: `packages/sim/src/index.ts`
- Create: `tests/sim/deterministic-replay.test.ts`

**Interfaces:**
- Public sim API exports `createSeedMarket`, `createSeededRng`, and `tickAsset`.

- [ ] **Step 1: Write replay test**

Starting from two independently created seed markets with the same seed and identical event/demand inputs, run 200 asset ticks and assert that every resulting asset price and movement reason is equal.

- [ ] **Step 2: Verify failure if exports/replay differ**

```bash
npm test -- tests/sim/deterministic-replay.test.ts
```
Expected before completion: FAIL.

- [ ] **Step 3: Fix only nondeterministic state sources**

Do not read `Date.now()` or `Math.random()` inside pure sim functions. Time and RNG are explicit inputs.

- [ ] **Step 4: Run the complete simulation suite**

```bash
npm test -- tests/sim
npm run typecheck
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/sim/src/index.ts tests/sim/deterministic-replay.test.ts
git commit -m "test: guarantee deterministic market replay"
```

---

### Task 9: Wrap the sim in an authoritative runtime

**Files:**
- Create: `apps/server/src/marketRuntime.ts`
- Create: `apps/server/src/marketRoutes.ts`
- Create: `apps/server/src/app.ts`
- Create: `apps/server/src/index.ts`
- Create: `tests/server/market-api.test.ts`

**Interfaces:**
- Produces `buildApp()` for tests.
- `GET /health` returns `{ "ok": true }`.
- `GET /api/market` returns the latest validated `MarketSnapshot`.
- `GET /ws/market` upgrades to WebSocket and immediately sends the latest snapshot; later snapshots are broadcast as they are generated.
- `MarketRuntime` is the only object allowed to mutate live market state in the process.

- [ ] **Step 1: Write the failing HTTP snapshot test**

```ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../apps/server/src/app.js';

const app = buildApp({ autoStart: false, seed: 12345 });

beforeAll(() => app.ready());
afterAll(() => app.close());

it('returns a market snapshot', async () => {
  const response = await app.inject({ method: 'GET', url: '/api/market' });
  expect(response.statusCode).toBe(200);
  const body = response.json();
  expect(body.assets.length).toBeGreaterThanOrEqual(6);
});
```

- [ ] **Step 2: Verify failure**

```bash
npm test -- tests/server/market-api.test.ts
```
Expected: FAIL because the server app does not exist.

- [ ] **Step 3: Implement runtime and routes**

Use different default intervals for stock and crypto updates. Keep `autoStart: false` available for deterministic tests. Register `@fastify/websocket` before WebSocket routes.

- [ ] **Step 4: Add a WebSocket test using Fastify's `injectWS` helper**

Assert that connecting to `/ws/market` receives a JSON message accepted by `marketSnapshotSchema`.

- [ ] **Step 5: Verify all tests**

```bash
npm test
npm run typecheck
```
Expected: PASS.

- [ ] **Step 6: Manually run the server**

```bash
npm run dev:server
```
Then request `http://localhost:3000/api/market` and verify stock/crypto assets are present and reasons are understandable.

- [ ] **Step 7: Commit**

```bash
git add apps/server tests/server
git commit -m "feat: serve authoritative realtime market snapshots"
```

---

### Task 10: Document the vertical slice and stop before UI

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: this plan file to check completed tasks during execution

**Interfaces:**
- README exposes install/test/dev commands.
- AGENTS current-state snapshot identifies the exact next milestone.

- [ ] **Step 1: Run final verification**

```bash
npm test
npm run typecheck
git status --short
```
Expected: tests and typecheck PASS; status contains only intended documentation updates.

- [ ] **Step 2: Update README status**

Change status from `Design freeze / pre-development` to `Market simulation vertical slice in development` or `Market simulation vertical slice complete`, matching reality. Add only the three commands needed to install, test, and run the server.

- [ ] **Step 3: Update AGENTS current-state snapshot**

Record the last verified commit, what works, known limitations, and the exact next milestone: **design the first Market screen from 2–4 concrete visual references before writing production UI code**.

- [ ] **Step 4: Commit and push**

```bash
git add README.md AGENTS.md docs/superpowers/plans/2026-08-26-market-simulation-vertical-slice.md
git commit -m "docs: record market simulation vertical slice"
git push origin main
```

Expected: remote `main` contains the verified vertical slice and updated handoff context.

---

## Self-Review

### Spec coverage for this sub-project

Covered here:
- one global market model;
- stocks + crypto with different behavior;
- moderate explainable simulation;
- simulated demand and bounded player influence;
- events;
- server-authoritative live state;
- deterministic/testable engine foundations.

Intentionally deferred to separate plans:
- accounts/auth/persistence;
- buy/sell portfolios and order ledger;
- career progression;
- alerts/notifications;
- social/leaderboards;
- Era lifecycle/Legacy conversion;
- production web UI and design system;
- mobile adaptation;
- post-MVP company control.

### Placeholder scan

This plan contains no `TBD`, `TODO`, `implement later`, or unspecified error-handling steps. Deferred systems are explicitly listed as separate future plans rather than hidden placeholders.

### Type/interface consistency

The market engine uses explicit state, time, and RNG inputs. The server consumes only the public exports from `@market-era/sim` and validates external snapshots through `@market-era/shared`.
