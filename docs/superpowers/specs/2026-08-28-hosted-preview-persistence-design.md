# Hosted preview persistence design

**Date:** 2026-08-28
**Status:** Approved implementation design
**Scope:** Hosted Stage 1.1 preview only; no gameplay or UI additions.

## Goal

Run the existing playable as one persistent shared fictional economy on a Vercel preview. Browser clients must continue to receive only the existing public market, portfolio, and trade contracts. TypeScript remains the sole owner of simulation, event generation, player pressure, and trade/accounting rules.

## Chosen architecture

Vercel serves the built Vite client and three stateless Node API functions. The browser polls the existing market endpoint every five seconds instead of depending on a process-local WebSocket. The polling abstraction has the same subscription-shaped surface as the old client transport, so a future push transport can replace it without changing game authority or UI session state.

Supabase Postgres holds one private canonical `game_state` row for the single demo player and global market. Every market read that may advance time and every trade runs in a real Postgres transaction and locks that row with `SELECT ... FOR UPDATE`. No Vercel instance owns durable game state or relies on in-memory coordination.

The row stores only the recovery state needed by this playable:

- full internal `MarketState`;
- seeded RNG state;
- last advance time, next event time, and event count;
- active bounded player-pressure impulses and their timestamps;
- demo-player cash and positions;
- next authoritative trade identifier.

It deliberately does not store client chart samples, objective progress, authentication, history, broader account systems, or any new game feature.

## Market recovery and ordering

While the row lock is held, the authority restores an ephemeral runtime from the persisted recovery state. It advances from the persisted timestamp to request time in deterministic bounded five-second steps, with one final partial step where necessary. This reproduces the existing cadence rather than applying a long idle period as one giant tick. It then persists the resulting recovery state before the transaction commits.

The lock means two instances cannot independently advance from the same old state. A request arriving after another request commits restores the already-advanced state and continues from there. A stale client response is still protected by the existing browser snapshot-ordering logic.

## Atomic trade behavior

The trade API locks and catches up the same row before it reads a price. It invokes the existing TypeScript trade accounting against a transaction-local portfolio initialized from that row, records the existing bounded player-pressure impulse, and writes the updated runtime and portfolio together before commit. A rejection leaves the persisted row unchanged. Consequently concurrent buys cannot overspend and concurrent sells cannot create impossible positions.

## Database and secrets

The migration creates a private schema/table and enables RLS without client policies. The browser never receives database URLs, keys, recovery JSON, raw pressure values, or RNG state. Vercel receives a server-only `DATABASE_URL` transaction-pooler variable; the repository contains only `.env.example` names, never values. `postgres` is used with prepared statements disabled for Supabase transaction pooling.

## Deployment

`vercel.json` builds the Vite app and routes `/api/market`, `/api/portfolio`, and `/api/trades` to Node functions. The same core authority is reusable by Fastify locally. The existing WebSocket server remains available for local development compatibility, but the hosted browser uses polling because a Vercel function cannot provide a reliable shared, long-lived publisher.

## Verification

Tests cover deterministic recovery, duplicate/stale public snapshots, bounded catch-up, durable player pressure, and concurrent atomic trade behavior through a lock-faithful in-memory repository seam. A deployed preview is manually checked from two sessions, across refresh/cold start, after a persisted trade, and for rejected invalid trades. The public market payload is inspected to confirm recovery-only values are absent.
