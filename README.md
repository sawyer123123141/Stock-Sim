# Market Era

**Market Era** is a working title for a colorful, beginner-friendly market strategy game built around a living fictional economy.

A player should be able to start with almost no knowledge of stocks, understand what is happening through plain-language explanations and visual cues, then gradually unlock deeper trading, research, social, and ownership systems as they become useful.

## Current status

The deterministic stock/crypto simulation is implemented, and the first authoritative realtime server slice is implemented on `feat/authoritative-market-runtime` pending merge review.

The server owns market time and state, can advance the deterministic simulation on a schedule, exposes the current fictional-market snapshot over HTTP, and streams authoritative updates over WebSocket. The current work still deliberately excludes accounts, a persistent portfolio/trade ledger, a database, and production UI.

The project intentionally separates the first playable version from the long-term vision so the game does not become an enormous pile of half-understood features.

## Architecture

- `packages/shared/` — shared market/domain contracts.
- `packages/sim/` — pure deterministic simulation engine. No UI, HTTP, database, timers, or hidden global randomness.
- `apps/server/` — authoritative Fastify + WebSocket runtime around the pure simulation.
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

## Design documents

- [Master design spec](docs/superpowers/specs/2026-08-26-market-era-design.md)
- [UI reference research](docs/ui-reference-research.md)
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
