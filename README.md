# Market Era

**Market Era** is a working title for a colorful, beginner-friendly market strategy game built around a living fictional economy.

A player should be able to start with almost no knowledge of stocks, understand what is happening through plain-language explanations and visual cues, then gradually unlock deeper trading, research, social, and ownership systems as they become useful.

## Current status

The deterministic stock/crypto simulation and authoritative realtime market server are merged into `main`. The first server-owned trading slice is implemented on `feat/first-trading-slice` pending merge review.

The server owns market time, prices, cash, and holdings. The current prototype supports one configured demo player with **$10,000.00 of fictional starting cash**, immediate whole-unit Buy/Sell market orders, no short selling, and no fees. Portfolio state is intentionally in memory and resets when the server restarts.

A database, authentication, production UI, advanced orders, and player trade impact on prices are still deliberately deferred. The project separates each slice so the first playable does not become an enormous pile of half-understood features.

## Architecture

- `packages/shared/` — shared market, portfolio, and trading contracts.
- `packages/sim/` — pure deterministic simulation engine. No UI, HTTP, database, timers, or hidden global randomness.
- `apps/server/` — authoritative Fastify + WebSocket runtime plus in-memory portfolio/trading services.
- `apps/web/` — planned React + Vite client. Production UI follows the reference/mockup gate and progressive-disclosure rules.

Node 24 LTS is the preferred development line; the project currently supports Node 22.12+.

## Development commands

```bash
npm install
npm test
npm run typecheck
npm run demo
npm run start:server
```

`npm test` compiles the TypeScript project and runs the Node behavior/regression suite. `npm run demo` prints a small fictional market with beginner-readable explanations. `npm run start:server` builds and starts the authoritative server on port `3000` by default; `HOST` and `PORT` can override its listener settings.

Current server endpoints:

- `GET /api/market` — current authoritative fictional-market snapshot.
- `WS /ws/market` — current snapshot immediately on connection, followed by authoritative market updates.
- `GET /api/portfolio` — current demo-player cash, holdings, and live portfolio valuation.
- `POST /api/trades` — immediate fictional Buy/Sell intent using only `assetId`, `side`, and whole-unit `quantity`.

The client never supplies canonical prices, balances, holdings, or an arbitrary player identity.

## Design documents

- [Master design spec](docs/superpowers/specs/2026-08-26-market-era-design.md)
- [UI reference research](docs/ui-reference-research.md)
- [Current UI direction](docs/mockups/2026-08-27-current-ui-direction.md)
- [First trading slice design](docs/superpowers/specs/2026-08-27-first-trading-slice-design.md)
- [First trading slice implementation plan](docs/superpowers/plans/2026-08-27-first-trading-slice.md)
- [Market simulation implementation plan](docs/superpowers/plans/2026-08-26-market-simulation-vertical-slice.md)
- [Agent handoff / compaction protocol](AGENTS.md)

## Product principles

1. **Game first, finance underneath.**
2. **Simple outside, deep inside.**
3. **A beginner can play without already understanding stocks.**
4. **New features deepen existing flows instead of adding permanent clutter.**
5. **More wealth should create more abstraction and automation, not more chores.**
6. **One spendable currency: money.**
7. **The UI must be reference-driven, colorful, readable, and deliberately crafted.**
8. **MVP scope is protected. Future ideas are documented, not silently promoted into version one.**

## Scope

The first playable focuses on fictional stocks and crypto, buying/selling with in-game money, a portfolio, simulated investors, explainable price movement, news/events, guided career goals, basic progression, alerts, a simple leaderboard/social layer, one functioning Market Era, and a polished desktop experience.

Company control, acquisitions, holding companies, deep procedural corporate lifecycles, complex macroeconomics, sophisticated executives, and a complete mobile client are future goals rather than MVP requirements.
