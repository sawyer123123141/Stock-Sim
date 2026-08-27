# Market Era

**Market Era** is a working title for a colorful, beginner-friendly market strategy game built around a living fictional economy.

A player should be able to start with almost no knowledge of stocks, understand what is happening through plain-language explanations and visual cues, then gradually unlock deeper trading, research, social, and ownership systems as they become useful.

## Current status

**First market-simulation prototype implemented on `feat/market-sim-vertical-slice`.**

The first code deliberately focuses on the smallest useful foundation: deterministic stock/crypto movement, events, bounded player pressure, simulated pressure, and plain-language movement explanations. No production UI, accounts, database, or company-management systems have been added yet.

The project intentionally separates the first playable version from the long-term vision so the game does not become an enormous pile of half-understood features.

## Architecture

- `packages/shared/` — shared market/domain contracts.
- `packages/sim/` — pure deterministic simulation engine. No UI, HTTP, database, timers, or hidden global randomness.
- `apps/server/` — planned authoritative Fastify + WebSocket runtime.
- `apps/web/` — planned React + Vite client after the first-screen reference/mockup gate is complete.

Node 24 LTS is the preferred development line; the pure engine currently supports Node 22.12+ so it remains compatible with modern Vite requirements when the web client is added.

## Prototype commands

```bash
npm install
npm test
npm run demo
```

`npm test` compiles the TypeScript engine and runs the deterministic Node test suite. `npm run demo` prints a small fictional market with beginner-readable explanations for recent movement.

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

The first playable focuses on stocks, crypto, buying/selling, a portfolio, simulated investors, explainable price movement, news/events, guided career goals, basic progression, non-wager market forecast challenges, alerts, a simple leaderboard/social layer, one functioning Market Era, and a polished desktop experience.

Company control, acquisitions, holding companies, deep procedural corporate lifecycles, complex macroeconomics, sophisticated executives, and a complete mobile client are future goals rather than MVP requirements.
