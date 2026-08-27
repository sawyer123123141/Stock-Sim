# First Trading Slice Design

**Date:** 2026-08-27  
**Status:** Approved under delegated first-playable design authority  
**Scope:** Server-owned in-memory portfolio and immediate fictional-market trading only

## Goal

Prove the smallest meaningful trading loop before production UI or persistence: the player has fictional cash, can buy and sell whole shares/coins at the current authoritative market price, and can see an updated portfolio whose value changes with the live fictional market.

This slice validates the account/trade data model without prematurely choosing a database.

## Product decisions

- Starting cash: **$10,000.00 fictional money**.
- Whole units only for the first playable. No fractional shares/coins.
- Market orders only. Orders fill immediately at the current authoritative server price.
- No short selling. A player can sell only units already owned.
- Zero fees and zero spread in this slice.
- Both fictional stocks and fictional crypto use the same basic trade path.
- No margin, leverage, limit orders, stop orders, take-profit, pending orders, tax lots, or advanced order routing.
- No real-money purchase, wagering, cash-out, or transfer mechanics.

## Architecture

Trading is server-authoritative and separate from the pure market simulation.

`packages/shared/` owns wire/domain contracts for trade intent and portfolio snapshots. `apps/server/` owns a small trading service plus a persistence-style store interface. The first store is in memory. The service reads current prices only from `MarketRuntime`; clients never submit execution prices, cash balances, or holdings.

Persistence is deliberately behind an interface so a database can later replace the in-memory store without rewriting trade rules.

## Demo identity

Authentication is not part of this slice. The server uses one configured local **demo player** identity for the first playable. The HTTP client does not choose an arbitrary player ID.

This is intentionally a local/prototype boundary, not a multiplayer authentication design. Real account identity is added with the persistence/auth subsystem later.

## Money representation

Canonical player cash and trade totals are stored as integer cents to avoid floating-point balance drift.

Market prices remain the simulation's dollar-number representation. At execution, the authoritative asset price is rounded to the nearest cent once and converted to `unitPriceCents`. Quantity is always a positive integer.

## Portfolio model

Canonical stored portfolio state contains:

- `playerId`
- `cashCents`
- positions keyed by asset ID
- each position stores `quantity` and `costBasisCents`

The public portfolio snapshot is derived from stored state plus the latest authoritative market snapshot and exposes readable dollar values:

- cash
- total market value
- total portfolio value
- positions with asset identity, quantity, current price, average cost, market value, and unrealized gain/loss

A position with zero quantity is removed.

## Cost basis

This slice uses one aggregate average-cost position per asset rather than exposing tax lots.

Buys add the exact filled trade cost to `costBasisCents`. Sells reduce cost basis proportionally to the fraction of the position sold, rounded deterministically to cents. The final sale removes the position entirely, preventing residual basis drift.

Realized P/L history is not needed for this first slice and is deferred.

## Trade flow

Client intent:

```json
{
  "assetId": "nova-motors",
  "side": "buy",
  "quantity": 10
}
```

Server flow:

1. validate side and positive whole quantity;
2. resolve the asset from the current authoritative market snapshot;
3. convert current price to cents;
4. load the demo player's portfolio from the store;
5. for a buy, reject if cash is insufficient;
6. for a sell, reject if holdings are insufficient;
7. apply the fill atomically inside the trading service/store boundary;
8. return the fill plus the newly derived portfolio snapshot.

The client never chooses execution price or canonical balances.

## HTTP boundary

### `GET /api/portfolio`

Returns the current demo-player portfolio valued using the latest authoritative market snapshot.

### `POST /api/trades`

Accepts only `assetId`, `side`, and integer `quantity`.

Success returns:

- immediate trade fill summary;
- updated portfolio snapshot.

Expected rejections use clear 4xx responses for malformed requests, unknown assets, insufficient cash, and insufficient holdings.

## Player market impact

Do **not** connect fills to market pressure in this slice.

Reason: trade correctness and player-impact tuning are separate concerns. The existing simulation already accepts bounded player pressure explicitly. After the buy/sell loop is stable, a later task can add a pressure accumulator between successful fills and scheduled market ticks without coupling portfolio accounting to simulation formulas.

## Persistence boundary

Define a small `PortfolioStore` interface with read/write responsibility. The first implementation is `InMemoryPortfolioStore` initialized with the demo player's $10,000 balance.

Do not add Postgres, Supabase, Prisma, an ORM, migrations, or account tables yet.

## Error handling

Reject:

- non-object/missing request body;
- unknown trade side;
- quantity <= 0;
- fractional/non-finite quantity;
- unknown asset ID;
- insufficient cash;
- insufficient holdings.

Rejected trades must not mutate portfolio state.

## Testing

Use TDD and the existing Node test runner.

Required coverage:

- fresh demo portfolio starts at exactly $10,000;
- successful buy deducts exact cents and adds quantity/cost basis;
- second buy updates aggregate cost basis;
- successful partial sell adds proceeds and reduces quantity/basis;
- final sell removes the position;
- insufficient cash cannot mutate state;
- overselling cannot mutate state;
- fractional/zero/negative quantity is rejected;
- unknown asset is rejected;
- portfolio market value changes when authoritative market price changes;
- HTTP GET returns authoritative derived portfolio;
- HTTP POST executes a valid trade and returns updated portfolio;
- HTTP validation maps failures to stable 4xx responses;
- existing market/runtime tests remain green.

## Explicitly deferred

- database/authentication;
- multiple real player accounts;
- trade history UI;
- realized P/L reporting;
- fees/spreads;
- player trade pressure on prices;
- pending/advanced orders;
- direct transfers;
- production web UI, which is the next separate slice.
