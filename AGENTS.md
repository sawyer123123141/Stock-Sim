# Market Era Agent Guide

This file is the **cold-start context and compaction protocol** for AI coding agents. Assume a new agent may enter with zero chat history. Read this file before editing code.

## 1. What this project is

Market Era is a colorful, beginner-friendly fictional stock/crypto strategy game built around one shared, server-authoritative economy.

The design target is **game first, finance underneath**: a player who barely knows what a stock is should be able to play, understand why prices moved in plain language, and gradually reveal deeper financial detail only when useful.

Do not turn this into:
- a professional trading terminal;
- a finance textbook;
- a casino or wagering product;
- a pile of unrelated minigames;
- a company-management tycoon;
- a feature-count competition;
- a generic AI dashboard.

## 2. Required read order for a fresh agent

Read these before making architectural or product decisions:

1. `AGENTS.md` — operating rules, repo map, and current handoff state.
2. `README.md` — concise project/status overview.
3. `docs/superpowers/specs/2026-08-26-market-era-design.md` — product source of truth.
4. `docs/ui-reference-research.md` — mandatory visual/UI constraints.
5. The active file under `docs/superpowers/plans/` — implementation source of truth for the current subsystem.
6. Relevant tests and implementation files for the task being changed.

If chat instructions conflict with the approved product spec, do not silently reinterpret the project. Surface the conflict and keep the approved design intact until a deliberate decision changes it.

## 3. Source-of-truth hierarchy

Use this order when documents disagree:

1. Latest explicit user decision.
2. Approved master design spec.
3. Active implementation plan.
4. `AGENTS.md` current-state snapshot.
5. README.
6. Existing implementation behavior.

Existing code is not automatically correct merely because it exists.

## 4. Non-negotiable product rules

- **Simple outside, deep inside.**
- **Progression adds depth, not clutter.** New unlocks should expand existing flows before creating new navigation.
- **One spendable currency: money.** Do not casually introduce gems/tokens/tickets/etc.
- **Owning assets must not automatically create chores.** Late-game complexity should be handled through delegation and abstraction.
- **Stocks and crypto must have genuinely different behavior.**
- **Price movement must be explainable but not perfectly predictable.**
- **The server is authoritative.** Clients never become the canonical source for market or account state.
- **One global fictional economy, available 24/7.**
- **Player market influence is bounded.** Simulated liquidity prevents coordinated users from making absurd price moves.
- **MVP scope is protected.** Future goals do not become MVP features because an implementation happens to be easy.
- **No real-money wagering or betting systems.** If short-term prediction gameplay is explored, keep it as non-wager forecasting/challenges.

## 5. UI rule: references before implementation

No production screen should begin with a prompt like “make a stock dashboard.”

Before implementing a major screen:

1. Define the screen’s single main job.
2. Define what a brand-new player sees.
3. Define what advanced information is progressively revealed.
4. Gather **2–4 concrete references** for that exact interaction/information problem.
5. Record what each reference contributes and what should not be copied.
6. Make an information hierarchy/wireframe.
7. Make a Market Era visual mockup.
8. Review crowding, terminology, spacing, motion, accessibility, and scaling.
9. Only then implement production UI.

Read `docs/ui-reference-research.md` for the current reference set and anti-slop rules.

## 6. Planned code architecture

The first implementation uses a TypeScript monorepo:

```text
apps/web/       React + Vite client. Display/input only; never authoritative.
apps/server/    Fastify authoritative server and realtime WebSocket layer.
packages/sim/   Pure deterministic market simulation engine.
packages/shared/ Shared domain/wire types and runtime schemas.
tests/          Cross-package tests where appropriate.
docs/           Product research, specs, and implementation plans.
```

Keep the simulation independent from React, Fastify, and database code. Pure simulation functions receive state/time/RNG as inputs so tests can replay the exact same market history.

Do not add a database, UI component package, mobile wrapper, deployment platform, or large framework unless the active plan actually requires it.

## 7. What the important files do

- `README.md` — human-facing project summary, status, and basic commands. Keep concise.
- `AGENTS.md` — AI-agent cold-start context, working rules, compaction protocol, and current handoff snapshot.
- `docs/superpowers/specs/2026-08-26-market-era-design.md` — approved full product vision, MVP boundary, and future goals. Product decisions belong here.
- `docs/ui-reference-research.md` — visual references, anti-slop rules, and required screen-design process.
- `docs/superpowers/plans/*.md` — executable subsystem plans. Check boxes as work is completed and keep the current plan accurate.
- `packages/sim/` — market math/behavior only. No HTTP, database, UI, timers, or hidden global randomness.
- `packages/shared/` — stable contracts shared across process boundaries.
- `apps/server/` — owns live market state, timers, commands, validation, and eventually persistence/auth.
- `apps/web/` — eventually renders the game and sends user intent to the server.

When new directories appear, update this map only if a fresh agent would otherwise misunderstand their responsibility.

## 8. Before changing code

Run or inspect, in this order:

```bash
git status --short
git branch --show-current
git log --oneline -8
```

Then:

1. Read the active plan task.
2. Search the repo for existing types/functions before inventing new ones.
3. Read the relevant tests.
4. Confirm the change is MVP scope.
5. For UI work, confirm the reference gate has already been completed.

Do not refactor unrelated code merely because it looks imperfect.

## 9. Development discipline

For each coherent task:

1. Write/adjust a failing test first when behavior is testable.
2. Run it and confirm it fails for the expected reason.
3. Implement the smallest correct change.
4. Run focused tests.
5. Run broader tests/typecheck before committing.
6. Inspect `git diff` rather than assuming the agent changed only what it intended.
7. Commit a coherent change with a descriptive message.
8. Push the branch/commit promptly so verified work does not exist only in one ephemeral environment.

Never claim a task is complete without current test evidence.

## 10. Context compaction / handoff protocol

Use this whenever:
- the agent is about to compact/summarize its context;
- another agent will take over;
- a long coding session is ending;
- the current subsystem reaches a review checkpoint.

### Before compaction or handoff

1. **Stop at a coherent boundary.** Avoid handing off half-written syntax when possible.
2. Run the verification commands required by the active plan. Once the standard scripts exist, normally run:
   ```bash
   npm test
   npm run typecheck
   ```
3. Run `git status --short` and inspect the diff.
4. Update completed checkboxes in the active implementation plan.
5. Update the **Current State Snapshot** at the bottom of this file with:
   - branch;
   - last verified commit hash;
   - what currently works;
   - verification results;
   - known failures/limitations;
   - exact next task/file to open.
6. Update `README.md` only if public status/setup commands changed.
7. Update the master design spec only when an approved product decision changed. Do **not** rewrite it to match accidental implementation details.
8. Update `docs/ui-reference-research.md` only when visual research/rules genuinely changed.
9. Commit the handoff/doc updates.
10. Push code and docs to the remote branch.
11. Confirm the remote commit exists before discarding context.

### Fresh-agent resume protocol

A fresh agent should:

1. Read the files in the required read order above.
2. Check out/pull the branch named in Current State Snapshot.
3. Verify the recorded commit hash exists.
4. Run the recorded verification commands before editing.
5. Open the exact next task and the relevant test first.
6. Continue from repo evidence, not guesses about what a previous agent probably meant.

If the snapshot and repository disagree, trust git/test evidence and repair the snapshot before continuing.

## 11. Scope control

Before adding a feature, ask:

- Does it strengthen discover → understand → predict → invest → react?
- Can a beginner understand it or safely ignore it?
- Can it fit an existing flow without another permanent navigation item?
- Does it create a decision rather than another repetitive tap?
- Is it actually required by the active plan?
- Can it remain a future goal instead?

If not, defer it. A smaller polished game beats 200 features nobody understands.

## 12. Current State Snapshot

**Status:** Approved design and implementation plan exist; market-simulation vertical slice is the active first subsystem.

**Active plan:** `docs/superpowers/plans/2026-08-26-market-simulation-vertical-slice.md`

**What exists now:** Documentation only. No production implementation has been merged yet.

**Next exact action:** Create the isolated implementation branch/worktree and begin Task 1 of the active plan.

**Verification at this snapshot:** Documentation paths were verified in the remote repository; no code test suite exists yet.
