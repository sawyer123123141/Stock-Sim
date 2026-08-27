# Market Era Agent Guide

This is the **cold-start context, handoff, and compaction protocol** for AI coding agents working in this repository. Assume a fresh agent has zero chat history.

Read this file before editing code.

## 1. Project in one paragraph

Market Era is a colorful, beginner-friendly fictional stock/crypto strategy game built around one shared economy. A player should be able to begin with almost no stock knowledge, understand market movement through plain language and visual cues, and gradually reveal deeper financial systems only when they become useful. The long-term fantasy is going from a tiny trader to an influential financial empire, but the MVP is deliberately much smaller.

Do **not** turn this project into:
- professional trading software;
- a finance textbook;
- a casino or wagering product;
- a pile of unrelated minigames;
- a company-management tycoon;
- a feature-count competition;
- a generic AI dashboard.

## 2. Fresh-agent read order

Before architectural/product work, read:

1. `AGENTS.md`
2. `README.md`
3. `docs/superpowers/specs/2026-08-26-market-era-design.md`
4. `docs/ui-reference-research.md`
5. the active file under `docs/superpowers/plans/`
6. relevant tests
7. relevant implementation files

Do not depend on chat history. The repository must contain enough context to reconstruct intent.

## 3. Source-of-truth order

When information conflicts:

1. latest explicit user decision;
2. safety/platform requirements;
3. approved master design spec;
4. active implementation plan;
5. current-state snapshot in this file;
6. README;
7. existing code behavior.

Existing code is evidence, not automatically the correct product decision.

## 4. Non-negotiable product rules

- **Game first, finance underneath.**
- **Simple outside, deep inside.**
- A beginner who barely knows what a stock is must be able to play.
- Unlocks should deepen existing flows before creating new tabs/buttons.
- **One spendable currency: money.** Do not casually introduce gems, tickets, research coins, etc.
- Richer players should gain abstraction/automation, not hundreds of chores.
- Stocks and crypto must behave meaningfully differently.
- Price movement must be explainable without becoming perfectly predictable.
- The server is ultimately authoritative; clients never own canonical market/account state.
- The intended live game has one global fictional economy available 24/7.
- Real-player market influence is bounded; simulated liquidity prevents absurd coordinated price moves.
- Future goals do not enter the MVP merely because they sound cool or happen to be easy to code.
- No real-money wagering or betting systems. Short-term prediction gameplay, if retained, must be a **non-wager forecast/challenge** mechanic.

## 5. Anti-slop feature gate

Before adding a feature, check:

- Does it strengthen `discover → understand → predict → invest → react`?
- Can a beginner understand it or safely ignore it?
- Can it fit an existing flow instead of creating another permanent navigation item?
- Does it create a real decision rather than repetitive tapping?
- Does it scale without creating chores later?
- Is it required by the active plan?
- Can it stay documented as a future goal instead?
- Can it be displayed without making the UI more crowded?

If several answers are weak, defer or simplify it.

## 6. UI: references before code

Never begin a major production screen with a generic prompt like “make a stock dashboard.”

Before implementation:

1. define the screen’s one main job;
2. define beginner-visible information;
3. define progressively revealed advanced information;
4. gather **2–4 concrete visual/product references** for that exact problem;
5. write what each reference contributes and what must not be copied;
6. make an information hierarchy/wireframe;
7. make a Market Era visual mockup;
8. review crowding, terminology, typography, spacing, motion, accessibility, and scaling;
9. only then implement production UI.

`docs/ui-reference-research.md` is mandatory reading for UI tasks. It currently contains the reference brief for the first planned screen, **Market Overview**.

## 7. Architecture

The intended architecture is a TypeScript monorepo with deliberately separated responsibilities:

```text
apps/web/         Planned React + Vite client. Display/input only; never authoritative.
apps/server/      Planned Fastify + WebSocket authoritative runtime.
packages/sim/     Pure deterministic market simulation engine.
packages/shared/  Shared domain and wire contracts.
tests/            Behavior/replay tests.
tools/            Small development/demo utilities only.
docs/             Product research, specs, and implementation plans.
```

### Current implemented foundation

`packages/sim/` is intentionally independent of React, Fastify, databases, wall-clock globals, and `Math.random()`.

Simulation functions receive state, time, pressure, events, and RNG explicitly. This lets tests replay exactly the same market history and lets future servers run the same engine without embedding server concerns into market math.

### Technology direction

- TypeScript for shared engine/server/client types.
- Node.js; Node 24 LTS preferred, minimum currently `22.12`.
- React + Vite planned for web/desktop-first client.
- Fastify + WebSockets planned for the authoritative live server.
- Persistence/auth are intentionally not selected/implemented yet; choose them in a dedicated plan when the portfolio/account subsystem actually needs them.

Do not add a database, ORM, UI framework, mobile wrapper, deployment platform, or state-management library just because the project will eventually need something in that category.

## 8. Important files and directories

- `README.md` — concise human-facing status, scope, and basic commands.
- `AGENTS.md` — this cold-start guide, workflow, compaction protocol, and current handoff snapshot.
- `docs/superpowers/specs/2026-08-26-market-era-design.md` — approved product vision, MVP boundary, post-MVP and long-term goals.
- `docs/ui-reference-research.md` — UI references, anti-slop visual rules, screen-design workflow, and current Market Overview brief.
- `docs/superpowers/plans/2026-08-26-market-simulation-vertical-slice.md` — first implementation plan. It originally includes a later Fastify/Vitest wrapper; read Current State below before assuming all tasks are complete.
- `packages/shared/src/market.ts` — market domain contracts.
- `packages/sim/src/rng.ts` — deterministic seeded random source.
- `packages/sim/src/fixtures.ts` — tiny hand-authored fictional seed market for tests/demo.
- `packages/sim/src/demand.ts` — simulated pressure plus capped player influence.
- `packages/sim/src/events.ts` — targeted event matching and time decay.
- `packages/sim/src/explain.ts` — converts raw movement contributions into ranked plain-language reasons.
- `packages/sim/src/tick.ts` — distinct stock and crypto tick formulas.
- `packages/sim/src/market.ts` — advances a complete market and creates client-friendly snapshots.
- `tests/*.test.mjs` — deterministic behavior tests using Node’s built-in test runner.
- `tools/demo.mjs` — tiny console demonstration; not production gameplay.

When a new important directory is introduced, update this map if a fresh agent would otherwise misunderstand it.

## 9. Before changing code

Inspect:

```bash
git status --short
git branch --show-current
git log --oneline -8
```

Then:

1. read the active plan/current-state section;
2. search for existing types/functions before inventing replacements;
3. read the relevant tests first;
4. confirm the change is in current scope;
5. for UI work, confirm the reference/mockup gate is complete.

Do not refactor unrelated code because it happens to offend the agent aesthetically.

## 10. Testing discipline

For testable behavior:

1. write or adjust a test;
2. confirm it fails for the expected reason when practical;
3. implement the smallest correct change;
4. run the focused test;
5. run the full relevant suite;
6. run type checking;
7. inspect the diff;
8. only then claim completion.

Current pure-engine commands after dependencies are installed:

```bash
npm test
npm run typecheck
npm run demo
```

The initial prototype was also independently verified in an isolated environment using the installed TypeScript compiler plus Node’s built-in test runner.

## 11. Git discipline

- Prefer an isolated feature branch/worktree for implementation.
- Make coherent commits rather than one giant archaeological layer.
- Push verified work promptly.
- Do not leave the only copy of working code in an ephemeral agent environment.
- Do not merge failing code knowingly.
- Before a PR/merge, verify tests and inspect the branch diff against `main`.

## 12. Context compaction / handoff protocol

Run this protocol whenever:
- context is about to be compacted/summarized;
- another agent will take over;
- a long work session is ending;
- a subsystem reaches a review checkpoint.

### Before compaction/handoff

1. Stop at a coherent boundary when possible.
2. Run the active plan’s verification commands.
3. Run `git status --short` and inspect the diff.
4. Update active-plan progress where practical. If execution intentionally diverged from the plan, record exactly why in **Current State Snapshot**.
5. Update **Current State Snapshot** below with:
   - branch;
   - last verified commit;
   - what works;
   - test/typecheck result;
   - known limitations/blockers;
   - exact next task and files to read.
6. Update README only if public status/setup changed.
7. Update the master design spec only for an approved product decision, never to rationalize accidental implementation behavior.
8. Update UI research only when reference evidence/rules or a screen brief genuinely changes.
9. Commit documentation/handoff changes.
10. Push branch/code/docs.
11. Confirm the remote commit exists.

### Fresh-agent resume protocol

1. Read the required files in order.
2. Check out/pull the branch in Current State Snapshot.
3. Verify the recorded commit exists.
4. Run the recorded verification command before editing.
5. Open the exact next task and relevant tests/files.
6. Continue from repo/test evidence, not guesses about prior chat.

If snapshot and git disagree, trust git/test evidence and repair the snapshot first.

## 13. Current State Snapshot

**Branch:** `feat/market-sim-vertical-slice`

**Last verified code commit:** `e644307ec3c9a93b9a1ee7f5ee78473a0783b365`

**Status:** The smallest pure market-simulation prototype exists and was locally verified. README and UI-reference documentation have additional commits after the code commit.

**What works:**
- six fictional seed assets: three stocks, three crypto coins;
- deterministic seeded RNG;
- stock and crypto formulas with intentionally different volatility/driver weights;
- simulated market pressure plus bounded player pressure;
- asset/sector/global news-event effects with decay;
- ranked beginner-readable reasons for price movement;
- deterministic whole-market replay;
- console demo of market output.

**Verification evidence:**
- TypeScript compilation: PASS in isolated local verification environment.
- Node test suite: **8 tests passed, 0 failed**.
- Deterministic replay test: PASS.
- Crypto-vs-stock volatility differentiation test: PASS.
- Plain-language movement explanation test: PASS.

**Known limitations / intentional omissions:**
- No authoritative Fastify/WebSocket runtime yet.
- No accounts, portfolio, buy/sell ledger, database, persistence, alerts, Era lifecycle, or leaderboards yet.
- No production UI yet.
- The current execution environment could not reach npm/GitHub from its code-running container, so external-dependency server tests could not be run truthfully. The pure engine was implemented with no runtime dependencies and verified using available Node/TypeScript tooling.
- The original active plan includes Vitest/Fastify steps that remain **unexecuted**; do not treat unchecked server work as complete.

**UI state:** `docs/ui-reference-research.md` now contains the first-screen **Market Overview** reference brief and wireframe-level information hierarchy. Production React UI is still blocked until a proper visual mockup is reviewed.

**Next exact engineering task:** Wrap the verified pure engine in the planned authoritative server once dependencies can be installed and tested. Start by re-reading `docs/superpowers/plans/2026-08-26-market-simulation-vertical-slice.md`, then inspect `packages/sim/src/index.ts` and the replay tests.

**Next exact design task:** Turn the Market Overview brief in `docs/ui-reference-research.md` into a visual desktop mockup before any production UI code.
