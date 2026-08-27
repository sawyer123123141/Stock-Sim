# First Trading Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first server-owned fictional portfolio and immediate whole-unit Buy/Sell flow on top of the authoritative market runtime.

**Architecture:** Shared contracts define client intent and portfolio/trade responses. A server-side `PortfolioStore` provides transactional mutation with an in-memory implementation, while `TradingService` owns validation/accounting and reads prices only from `MarketRuntime`. Fastify routes bind one configured demo player to the service; no database or auth is introduced.

**Tech Stack:** TypeScript, Node.js 24, Fastify 5, existing Node test runner, existing deterministic market runtime.

**Spec:** `docs/superpowers/specs/2026-08-27-first-trading-slice-design.md`

## Global Constraints

- Starting cash is exactly `$10,000.00` fictional money.
- Whole positive integer quantities only. No fractional units.
- Immediate market orders only.
- No short selling, margin, leverage, advanced orders, fees, or spread.
- Canonical cash and trade totals use integer cents.
- Client never submits execution price, cash, holdings, or player ID.
- No database, ORM, authentication, real-money purchase, wagering, cash-out, or direct transfer systems.
- Trading accounting remains outside `packages/sim/`.
- Successful fills do not affect market pressure in this slice.

---

### Task 1: Shared trading contracts

**Files:**
- Create: `packages/shared/src/trading.ts`
- Modify: `packages/shared/src/index.ts`
- Test: TypeScript compilation through `npm run typecheck`

**Interfaces:**
- Produces: `TradeSide`, `TradeIntent`, `TradeFill`, `PortfolioPositionSnapshot`, `PortfolioSnapshot`, `TradeExecutionResponse`, `TradingErrorCode`, `TradingErrorResponse`.

- [ ] **Step 1: Add the shared contract file**

```ts
export type TradeSide = "buy" | "sell";

export interface TradeIntent {
  assetId: string;
  side: TradeSide;
  quantity: number;
}

export interface TradeFill {
  id: string;
  assetId: string;
  symbol: string;
  side: TradeSide;
  quantity: number;
  unitPrice: number;
  total: number;
  executedAt: string;
}

export interface PortfolioPositionSnapshot {
  assetId: string;
  symbol: string;
  name: string;
  kind: "stock" | "crypto";
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
}

export interface PortfolioSnapshot {
  cash: number;
  marketValue: number;
  totalValue: number;
  positions: PortfolioPositionSnapshot[];
}

export interface TradeExecutionResponse {
  fill: TradeFill;
  portfolio: PortfolioSnapshot;
}

export type TradingErrorCode =
  | "INVALID_TRADE"
  | "ASSET_NOT_FOUND"
  | "INSUFFICIENT_CASH"
  | "INSUFFICIENT_HOLDINGS";

export interface TradingErrorResponse {
  error: TradingErrorCode;
  message: string;
}
```

- [ ] **Step 2: Export the contracts from `packages/shared/src/index.ts`**

```ts
export * from "./market.js";
export * from "./trading.js";
```

- [ ] **Step 3: Run type checking**

Run: `npm run typecheck`  
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/trading.ts packages/shared/src/index.ts
git commit -m "feat: add shared trading contracts"
```

---

### Task 2: Transactional in-memory portfolio store and trading service

**Files:**
- Create: `apps/server/src/portfolioStore.ts`
- Create: `apps/server/src/tradingService.ts`
- Create: `tests/trading-service.test.mjs`

**Interfaces:**
- Consumes: `MarketRuntime`, `TradeIntent`, `TradeExecutionResponse`, `PortfolioSnapshot`, `TradingErrorCode`.
- Produces: `PortfolioStore`, `InMemoryPortfolioStore`, `PortfolioState`, `TradingError`, `TradingService`, `createTradingService()`.

- [ ] **Step 1: Write failing service tests**

Tests must cover:

```js
// fresh portfolio
assert.equal((await service.getPortfolio("demo-player")).cash, 10_000);

// exact whole-unit buy
const bought = await service.executeTrade("demo-player", {
  assetId: nova.id,
  side: "buy",
  quantity: 10
});
assert.equal(bought.fill.quantity, 10);
assert.equal(bought.portfolio.positions[0].quantity, 10);

// invalid quantities
await assert.rejects(
  () => service.executeTrade("demo-player", { assetId: nova.id, side: "buy", quantity: 1.5 }),
  (error) => error.code === "INVALID_TRADE"
);

// insufficient cash leaves portfolio unchanged
// overselling leaves portfolio unchanged
// second buy increases aggregate basis
// partial sell reduces quantity and basis
// final sell removes position
// unknown asset rejects
// market valuation changes after runtime price changes
```

Use a deterministic `MarketRuntime` with `startedAtMs` fixed in the test. Read the current Nova asset from `runtime.snapshot()` rather than hardcoding a client execution price.

- [ ] **Step 2: Run the focused tests and confirm RED**

Run: `npm test -- --test-name-pattern="trading"` if supported by the repository script; otherwise run `npm test`.

Expected: FAIL because `portfolioStore.js` / `tradingService.js` do not exist yet.

- [ ] **Step 3: Implement canonical store state and transactional mutation**

`apps/server/src/portfolioStore.ts`:

```ts
export interface StoredPosition {
  quantity: number;
  costBasisCents: number;
}

export interface PortfolioState {
  playerId: string;
  cashCents: number;
  positions: Record<string, StoredPosition>;
}

export interface PortfolioStore {
  read(playerId: string): Promise<PortfolioState>;
  transact<T>(playerId: string, mutation: (working: PortfolioState) => T): Promise<T>;
}

export class InMemoryPortfolioStore implements PortfolioStore {
  // Initialize missing players with exactly 1_000_000 cents.
  // Clone on read.
  // transact() clones current state, invokes mutation, and commits the working
  // copy only when mutation returns successfully. If mutation throws, state is unchanged.
}
```

Implement a per-player promise queue inside `transact()` so concurrent mutations for the same player serialize. Different player IDs do not need to block each other.

- [ ] **Step 4: Implement trading service validation/accounting**

`apps/server/src/tradingService.ts`:

```ts
export class TradingError extends Error {
  constructor(public readonly code: TradingErrorCode, message: string) {
    super(message);
  }
}

export interface TradingService {
  getPortfolio(playerId: string): Promise<PortfolioSnapshot>;
  executeTrade(playerId: string, intent: TradeIntent): Promise<TradeExecutionResponse>;
}

export function createTradingService(options: {
  runtime: MarketRuntime;
  store: PortfolioStore;
  now?: () => number;
}): TradingService;
```

Rules:

```ts
if (!intent || typeof intent !== "object") invalid();
if (intent.side !== "buy" && intent.side !== "sell") invalid();
if (typeof intent.assetId !== "string" || intent.assetId.length === 0) invalid();
if (!Number.isSafeInteger(intent.quantity) || intent.quantity <= 0) invalid();

const asset = runtime.snapshot().assets.find((candidate) => candidate.id === intent.assetId);
if (!asset) throw new TradingError("ASSET_NOT_FOUND", "Asset not found.");

const unitPriceCents = Math.round(asset.price * 100);
const totalCents = unitPriceCents * intent.quantity;
if (!Number.isSafeInteger(totalCents)) invalid();
```

Buy accounting:

```ts
if (portfolio.cashCents < totalCents) {
  throw new TradingError("INSUFFICIENT_CASH", "Not enough cash for this trade.");
}
portfolio.cashCents -= totalCents;
position.quantity += quantity;
position.costBasisCents += totalCents;
```

Sell accounting:

```ts
if (!position || position.quantity < quantity) {
  throw new TradingError("INSUFFICIENT_HOLDINGS", "Not enough units to sell.");
}
portfolio.cashCents += totalCents;
if (quantity === position.quantity) {
  delete portfolio.positions[asset.id];
} else {
  const soldBasis = Math.round(position.costBasisCents * (quantity / position.quantity));
  position.quantity -= quantity;
  position.costBasisCents -= soldBasis;
}
```

Portfolio derivation converts cents back to rounded two-decimal dollar numbers and values each position against the current authoritative market snapshot. `totalValue = cash + marketValue`.

Use a service-local monotonic trade counter for IDs such as `trade-1`; persistence of IDs across restarts is deferred.

- [ ] **Step 5: Run focused/full tests**

Run: `npm test`  
Expected: all existing tests plus new trading-service tests PASS.

Run: `npm run typecheck`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/server/src/portfolioStore.ts apps/server/src/tradingService.ts tests/trading-service.test.mjs
git commit -m "feat: add in-memory portfolio trading service"
```

---

### Task 3: Portfolio and trade HTTP routes

**Files:**
- Create: `apps/server/src/tradingRoutes.ts`
- Modify: `apps/server/src/app.ts`
- Modify: `apps/server/src/server.ts`
- Create: `tests/trading-api.test.mjs`

**Interfaces:**
- Consumes: `TradingService`, fixed server-side `playerId`.
- Produces: `GET /api/portfolio`, `POST /api/trades`.

- [ ] **Step 1: Write failing HTTP tests**

Create `tests/trading-api.test.mjs` covering:

```js
const response = await app.inject({ method: "GET", url: "/api/portfolio" });
assert.equal(response.statusCode, 200);
assert.equal(response.json().cash, 10_000);

const tradeResponse = await app.inject({
  method: "POST",
  url: "/api/trades",
  payload: { assetId: nova.id, side: "buy", quantity: 2 }
});
assert.equal(tradeResponse.statusCode, 200);
assert.equal(tradeResponse.json().portfolio.positions[0].quantity, 2);
```

Also assert stable failures:

- malformed/fractional quantity -> 400 `INVALID_TRADE`;
- unknown asset -> 404 `ASSET_NOT_FOUND`;
- insufficient cash -> 409 `INSUFFICIENT_CASH`;
- insufficient holdings -> 409 `INSUFFICIENT_HOLDINGS`;
- rejected request leaves subsequent GET state unchanged.

- [ ] **Step 2: Run tests and confirm RED**

Run: `npm test`  
Expected: FAIL because trading routes/composition do not exist.

- [ ] **Step 3: Implement trading routes**

`apps/server/src/tradingRoutes.ts`:

```ts
export function registerTradingRoutes(
  app: FastifyInstance,
  options: { trading: TradingService; playerId: string }
): void {
  app.get("/api/portfolio", async () => options.trading.getPortfolio(options.playerId));

  app.post("/api/trades", async (request, reply) => {
    try {
      return await options.trading.executeTrade(options.playerId, request.body as TradeIntent);
    } catch (error) {
      if (!(error instanceof TradingError)) throw error;
      const status = error.code === "ASSET_NOT_FOUND" ? 404
        : error.code === "INVALID_TRADE" ? 400
        : 409;
      return reply.code(status).send({ error: error.code, message: error.message });
    }
  });
}
```

- [ ] **Step 4: Compose the service into app/server**

Update `buildMarketApp()` options to accept `trading` and `playerId`, then register `registerTradingRoutes()` in the same route scope after WebSocket initialization.

Update `createMarketServer()` to create:

```ts
const runtime = options.runtime ?? createMarketRuntime();
const store = options.store ?? new InMemoryPortfolioStore();
const trading = options.trading ?? createTradingService({ runtime, store });
const playerId = options.playerId ?? "demo-player";
```

Expose `trading` on the returned server object for tests. Do not expose client-selected player identity through HTTP.

- [ ] **Step 5: Run full verification**

Run: `npm test`  
Expected: PASS.

Run: `npm run typecheck`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/server/src/tradingRoutes.ts apps/server/src/app.ts apps/server/src/server.ts tests/trading-api.test.mjs
git commit -m "feat: expose server-owned fictional trading API"
```

---

### Task 4: Checkpoint docs and pre-merge verification

**Files:**
- Modify: `README.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Documents the new server routes and exact next client task.

- [ ] **Step 1: Update README**

Add the current endpoints:

```text
GET  /api/market
WS   /ws/market
GET  /api/portfolio
POST /api/trades
```

State clearly that portfolio/trading is in-memory, uses one configured demo player, starts with $10,000 fictional money, and resets when the server restarts.

- [ ] **Step 2: Update AGENTS.md**

Record:

- `packages/shared/src/trading.ts`;
- `portfolioStore.ts`, `tradingService.ts`, `tradingRoutes.ts`;
- first-trading-slice spec/plan;
- no database/auth yet;
- whole-unit market orders, no shorts, no fees;
- exact next task: simplified Stage-1 React/Vite client with Nova Motors live chart, Buy/Sell, cash/holdings, and one explanation.

- [ ] **Step 3: Run fresh full verification after docs**

Run: `npm test`  
Expected: PASS with 0 failures.

Run: `npm run typecheck`  
Expected: PASS.

- [ ] **Step 4: Compare branch against `main`**

Confirm the diff contains only shared trading contracts, server portfolio/trading implementation, tests, and relevant docs. No database, auth, UI, advanced orders, or unrelated refactors.

- [ ] **Step 5: Commit checkpoint docs**

```bash
git add README.md AGENTS.md
git commit -m "docs: checkpoint first trading slice"
```
