# Story Lifecycle / Market History V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Compact inactive private stories into safe persisted history while keeping normal market snapshots bounded and making archive history available on demand.

**Architecture:** The deterministic runtime owns the runtime/history partition. The public market projection sends only developing plus time-derived recent stories, while an asset-scoped server history route returns relevance-filtered archive pages. The browser groups the public results without deriving hidden simulation data.

**Tech Stack:** TypeScript, Fastify, React/Vite, Node test runner, existing Postgres JSONB game state.

**Spec:** `docs/superpowers/specs/2026-08-29-story-lifecycle-v1-design.md`

## Global Constraints

- Keep `appliedInformationIds` unchanged and unpruned.
- Do not change simulation/trading/relationship tuning or persistence locking.
- Never send private story outcomes, expectations, effects, reaction windows, plans, or RNG to the browser.
- `RECENT_STORY_WINDOW_MS` is server-owned and equals 30 minutes.
- Normal `MarketSnapshot` data is bounded; archive history is loaded through a public server-owned asset-scoped path.

---

### Task 1: Runtime history contract and deterministic compaction

**Files:**
- Modify: `packages/shared/src/market.ts`
- Modify: `packages/sim/src/market.ts`
- Modify: `apps/server/src/marketRuntime.ts`
- Test: `tests/market-stories.test.mjs`

**Interfaces:**
- Produces a public-only persisted historical-story type and `storyHistory` recovery state.
- Produces deterministic compaction after expired event removal.

- [ ] Write failing tests for resolved/private-to-history compaction, pending-update retention, private-field stripping, related metadata, and restart/dormant equivalence.
- [ ] Run the focused tests and confirm the expectations fail because no history collection or compactor exists.
- [ ] Add the minimal types, projection helpers, and post-tick compactor.
- [ ] Re-run focused tests and commit the green runtime slice.

### Task 2: Bounded live snapshot and public history route

**Files:**
- Modify: `packages/shared/src/market.ts`
- Modify: `packages/sim/src/market.ts`
- Modify: `apps/server/src/persistentGameAuthority.ts`
- Modify: `apps/server/src/marketRoutes.ts`
- Modify: `apps/web/src/api.ts`
- Test: `tests/market-stories.test.mjs`
- Test: `tests/market-routes.test.mjs`

**Interfaces:**
- `MarketSnapshot.stories` contains developing/recent only.
- `GET /api/stories/:assetId` returns deterministic relevant public history, never raw archive internals.

- [ ] Write failing route/projection tests proving an old archive item is absent from normal snapshots, available through the scoped history route, public-only, and relevance-filtered.
- [ ] Run focused tests and confirm they fail because no history query exists.
- [ ] Implement named recent-window filtering and a bounded deterministic archive result using existing public relevance rules.
- [ ] Re-run focused tests and commit the green transport slice.

### Task 3: Stories lifecycle UI and chart archive range loading

**Files:**
- Modify: `apps/web/src/components/StoryHistory.tsx`
- Modify: `apps/web/src/marketEventSelection.ts`
- Modify: `apps/web/src/useMarketSession.ts`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/components/PriceChart.tsx`
- Modify: `apps/web/src/styles.css`
- Test: `tests/web-market-story-selection.test.mjs`
- Test: `tests/web-market-experience-v1.test.mjs`

**Interfaces:**
- The Stories panel renders non-overlapping Developing, Recent, Archive groups from public data.
- The Overview remains limited to a developing/recent selection.

- [ ] Write failing browser-facing tests for grouping, archive reachability, no duplicate section membership, crypto compatibility, and no unbounded overview history.
- [ ] Run focused tests and confirm they fail because only one flat history list exists.
- [ ] Implement minimal on-demand archive fetch state and grouped presentation; load chart archive updates only for its displayed time range.
- [ ] Re-run focused tests and commit the green UI slice.

### Task 4: Full verification and review

**Files:**
- Modify only files required by Tasks 1–3 and the two design documents.

- [ ] Run `npm test`, `npm run typecheck`, `git diff --check`, and `npm run build:web`.
- [ ] Inspect the complete diff against `main` for simulation, privacy, and scope regressions.
- [ ] Manually verify the deployed preview at desktop and 390px after Vercel builds the PR.
- [ ] Push a single review-only PR; verify exact-head GitHub Actions and Vercel without merging.
