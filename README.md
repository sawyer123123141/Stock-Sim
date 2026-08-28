# Market Era

**Market Era** is a working title for a colorful, beginner-friendly market strategy game built around a living fictional economy.

A player should be able to start with almost no knowledge of stocks, understand what is happening through plain-language explanations and visual cues, then gradually unlock deeper trading, research, social, and ownership systems as they become useful.

## Current status

The repository now contains the deterministic stock/crypto simulation, authoritative realtime market server, server-owned fictional portfolio/trading slice, and the first playable React + Vite market client.

The server owns market time, prices, cash, holdings, and trade execution. The current prototype supports one configured demo player with **$10,000.00 of fictional starting cash**, immediate whole-unit Buy/Sell market orders, no short selling, and no fees. Portfolio state is intentionally in memory and resets when the server restarts.

The first playable client intentionally stays narrow: five visible assets, one selected asset, a live-session chart built only from authoritative snapshots received during the current browser session, one Buy/Sell path, a compact position panel, one plain-language movement story, and one next objective. The browser projects the server-owned holdings over the latest authoritative WebSocket prices so displayed portfolio value and unrealized P/L stay current without letting the client invent canonical balances or fills.

Stage 1.1 sharpens the first few minutes without adding another system: empty accounts no longer waste space on a blank position card, successful trades show a compact receipt using the authoritative server fill, beginner objectives advance through a tiny first-session sequence without regressing after a sale, the chart waits for a real second snapshot instead of fabricating a line, and live quote updates get a restrained visual pulse. The objective memory is browser-session guidance only, not persistent account state.

A database, authentication, advanced orders, persistent historical chart data, and broader progression/social systems are still deliberately deferred. Successful player trades now add only a small, short-lived server-owned pressure signal, while deterministic simulated investor activity remains the dominant market force. The project separates each slice so the first playable does not become an enormous pile of half-understood features.

## Architecture

- `packages/shared/` — shared market, portfolio, and trading contracts.
- `packages/sim/` — pure deterministic simulation engine. No UI, HTTP, database, timers, or hidden global randomness.
- `apps/server/` — authoritative Fastify + WebSocket runtime plus in-memory portfolio/trading services.
- `apps/web/` — React + Vite first-playable client. Display/input only; server state remains authoritative.

Node 24 LTS is the preferred development line; the project currently supports Node 22.12+.

## Development commands

```bash
npm install
npm test
npm run typecheck
npm run demo
npm run start:server
npm run dev:web
npm run build:web
```

`npm test` compiles the Node/shared TypeScript, runs the behavior/regression suite, and builds the browser client. `npm run typecheck` checks both the Node/shared code and the strict browser TypeScript project. `npm run demo` prints a small fictional market with beginner-readable explanations. `npm run start:server` builds and starts the authoritative server on port `3000` by default; `HOST` and `PORT` can override its listener settings. `npm run dev:web` starts the Vite development client, and `npm run build:web` creates the production browser bundle.

For the playable client, run the server and Vite dev client in separate terminals. The Vite config proxies API and WebSocket traffic to the local authoritative server.

Current server endpoints:

- `GET /api/market` — current authoritative fictional-market snapshot.
- `WS /ws/market` — current snapshot immediately on connection, followed by authoritative market updates.
- `GET /api/portfolio` — current demo-player cash, holdings, and server-derived live valuation.
- `POST /api/trades` — immediate fictional Buy/Sell intent using only `assetId`, `side`, and whole-unit `quantity`.

The client never supplies canonical prices, balances, holdings, or an arbitrary player identity.

## First playable boundaries

The first client slice deliberately includes:

- up to five immediately visible fictional assets;
- Nova Motors selected by default when present;
- current price and latest simulation-tick movement;
- a real session chart using received authoritative prices only;
- whole-unit Buy/Sell trading;
- compact authoritative fill feedback after a successful trade;
- cash available, owned units, average cost, market value, and unrealized P/L;
- position details only after the selected asset is actually owned;
- one highest-ranked plain-language movement reason;
- one beginner objective at a time, with first-session accomplishments remembered for the current browser session;
- responsive layout and reduced-motion support.

It deliberately does **not** include limit orders, stops, margin, leverage, extra currencies, a shop, Top Movers, fake historical candles, or a wall of progression widgets.

## Design documents

- [Master design spec](docs/superpowers/specs/2026-08-26-market-era-design.md)
- [UI reference research](docs/ui-reference-research.md)
- [Current UI direction](docs/mockups/2026-08-27-current-ui-direction.md)
- [First trading slice design](docs/superpowers/specs/2026-08-27-first-trading-slice-design.md)
- [First trading slice implementation plan](docs/superpowers/plans/2026-08-27-first-trading-slice.md)
- [Stage 1 web client implementation plan](docs/superpowers/plans/2026-08-27-stage-1-web-client.md)
- [Market simulation implementation plan](docs/superpowers/plans/2026-08-26-market-simulation-vertical-slice.md)
- [Agent handoff / compaction protocol](AGENTS.md)

## Product principles

1. **Game first, finance underneath.**
2. **Simple outside, deep inside.**
3. **A beginner can play without already understanding stocks.**
4. **New features deepen existing flows instead of adding permanent clutter.**
5. **More wealth should create more abstraction and automation, not more chores.**
6. **One spendable currency: money.**
7. **The market core should look credible while the surrounding experience feels like a polished strategy game.**
8. **MVP scope is protected. Future ideas are documented, not silently promoted into version one.**

## Scope

The broader MVP targets fictional stocks and crypto, buying/selling with in-game money, a portfolio, simulated investors, explainable price movement, news/events, guided career goals, basic progression, alerts, a simple leaderboard/social layer, one functioning Market Era, and a polished desktop experience.

Company control, acquisitions, holding companies, deep procedural corporate lifecycles, complex macroeconomics, sophisticated executives, and a complete mobile client are future goals rather than first-playable requirements.
