# Developing Market Stories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver deterministic staged public market stories, safe public projections, a compact story UI, and timestamp-based chart annotations.

**Architecture:** Persist internal story plans in `MarketState`; materialize an existing `MarketEvent` only when an update becomes public on the runtime's canonical clock. Project only published update metadata into `MarketSnapshot.stories`, then render the most relevant story and its visible chart annotations from that public contract.

**Tech Stack:** TypeScript, Node test runner, React/Vite, Fastify runtime, existing deterministic simulation and persisted runtime JSON.

**Spec:** `docs/superpowers/specs/2026-08-29-developing-market-stories-design.md`

## Global Constraints

- Keep TypeScript simulation/server authoritative; do not expose future plans, outcomes, expectations, effects, pressures, fundamentals, or RNG state.
- Reuse `MarketEvent` reactions; do not add a parallel pricing engine or browser scheduling.
- Process planned updates before a same-time generated story; secondary ordering is update ID.
- Preserve persisted recovery compatibility with `appliedEventIds`; do not consume RNG or time while hydrating.
- Keep the chart as the visual center and retain current responsive/reduced-motion behavior.
- Do not add navigation, alerts, research pages, gameplay mechanics, dependencies, or schema migrations.

---

### Task 1: Define internal and public story contracts

**Files:**
- Modify: `packages/shared/src/market.ts`
- Modify: `packages/sim/src/market.ts`
- Test: `tests/market-stories.test.mjs`

**Interfaces:**
- Produce internal `MarketStory`, `MarketStoryUpdate`, and `MarketState.stories`.
- Produce public `MarketStorySnapshot`, `MarketStoryUpdateSnapshot`, and `MarketSnapshot.stories`.
- Produce `toMarketStorySnapshots(stories, generatedAtMs)` that contains published metadata only.

- [x] **Step 1: Write failing contract/projection tests**

```js
assert.deepEqual(toMarketStorySnapshots([story], 5_000), [{
  id: "story-1", title: "NOVA launch", target: { kind: "asset", value: "nova" },
  status: "developing", updates: [{ id: "story-1:update-1", title: "Demand reported", summary: "...", publishedAt: "1970-01-01T00:00:05.000Z" }]
}]);
assert.doesNotMatch(JSON.stringify(snapshot), /future title|outcome|effect|surprise|significance|fundamentalImpact/);
```

- [x] **Step 2: Run the focused test and confirm it fails because story types/projection do not exist.**

- [x] **Step 3: Add the smallest contracts and public projection; initialize seed state with `stories: []`.**

- [x] **Step 4: Re-run the focused tests and commit the contract slice.**

### Task 2: Generate deterministic simple and staged story plans

**Files:**
- Modify: `packages/sim/src/eventGenerator.ts`
- Modify: `packages/sim/src/index.ts`
- Test: `tests/market-stories.test.mjs`

**Interfaces:**
- Produce `createMarketStory({ id, publishedAt, rng, assets }): MarketStory`.
- Retain `createMarketEvent` for existing direct consumers and legacy compatibility.

- [x] **Step 1: Add failing tests that force a staged stock template and a simple crypto/sector template, asserting unique ordered IDs and no precomputed follow-up surprise.**
- [x] **Step 2: Run the focused test and confirm `createMarketStory` is missing.**
- [x] **Step 3: Extract shared catalog selection and define sparse staged updates for NOVA launch/supplier, LUMA breakthrough/timetable, and Harvest Grid contract; keep routine templates single-update.**
- [x] **Step 4: Re-run focused generation tests and commit.**

### Task 3: Publish stories on the canonical runtime clock

**Files:**
- Modify: `apps/server/src/marketRuntime.ts`
- Modify: `packages/sim/src/companyEventConsequences.ts` only if update-level application needs a narrow helper
- Test: `tests/market-stories.test.mjs`
- Test: `tests/persistent-game-authority.test.mjs`

**Interfaces:**
- Recovery state emits `appliedInformationIds: string[]` and accepts legacy `appliedEventIds`.
- Publishing one update creates one `MarketEvent` reaction with its surprise/effect resolved at the update's canonical time.

- [x] **Step 1: Add failing runtime tests for invisibility before publication, exact once-only consequence/event application, post-update expectation snapshot for a follow-up, same-time pending-update-before-new-story ordering, and legacy hydration without RNG/time changes.**
- [x] **Step 2: Run focused tests and confirm they fail on absent story scheduling/marker behavior.**
- [x] **Step 3: Implement update publication, stable ordering, update-level reaction materialization, broadened markers, and legacy recovery.**
- [x] **Step 4: Add failing persistent tests comparing continuous, restart, and dormant catch-up runtime recovery state.**
- [x] **Step 5: Re-run focused runtime/persistence tests and commit.**

### Task 4: Select and render public Developing Stories

**Files:**
- Modify: `apps/web/src/marketEventSelection.ts`
- Modify: `apps/web/src/components/NewsStory.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/insights.css`
- Test: `tests/web-market-story-selection.test.mjs`
- Test: `tests/web-static.test.mjs`

**Interfaces:**
- Produce `selectRelevantMarketStory(asset, stories): MarketStorySnapshot | null`.
- `NewsStory` receives a public story and renders only its published timeline.

- [x] **Step 1: Add failing selector tests for asset/sector/global relevance, latest-update tie breaking, and irrelevant company exclusion.**
- [x] **Step 2: Run the selector test and confirm the story selector is missing.**
- [x] **Step 3: Add the selector and replace the card's public presentation with compact developing/resolved/one-update treatments; no directional labels.**
- [x] **Step 4: Add static UI assertions for status, published updates only, compact simple stories, and absence of good/bad/bullish/bearish labels; run them and commit.**

### Task 5: Add timestamp-based public chart markers

**Files:**
- Modify: `apps/web/src/components/PriceChart.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/styles.css`
- Test: `tests/web-price-chart-markers.test.mjs`

**Interfaces:**
- Produce pure `selectChartStoryMarkers(samples, updates)` returning only updates inside `[first.atMs, last.atMs]` with `x` derived from timestamp.
- `PriceChart` consumes public updates and renders neutral accessible interactive markers.

- [x] **Step 1: Add failing helper tests for visible/invisible/irrelevant updates, timestamp-to-range coordinate mapping, and accessible title text.**
- [x] **Step 2: Run the focused test and confirm the helper is missing.**
- [x] **Step 3: Implement the small pure helper and SVG marker controls with hover/focus/tap detail, then add restrained CSS.**
- [x] **Step 4: Run marker tests and the Vite build; manually inspect desktop and 390px layouts. Commit.**

### Task 6: Measure, verify, review, and integrate for review

**Files:**
- Create: `tools/traceDevelopingStories.mjs` only if existing test helpers cannot produce the required reproducible traces
- Modify: `README.md` only if public setup/status needs an accurate update

- [x] **Step 1: Run deterministic NOVA launch, NOVA supplier, and LUMA breakthrough traces recording initial, pre-follow-up, post-follow-up, and later prices/repricing behavior.**
- [x] **Step 2: Run `npm test`, `npm run typecheck`, `git diff --check`, and the production Vite build.**
- [x] **Step 3: Inspect complete diff against `main`; confirm no secrets, persistence schema changes, unrelated refactors, or hidden-state leakage.**
- [ ] **Step 4: Commit remaining changes, push the feature branch, open one PR against latest `main`, and wait for fresh exact-head GitHub Actions and Vercel Preview. Do not merge.**

## Self-review

- Spec coverage: Tasks 1–3 cover persistence, timing, ordering, recovery, and public safety; Tasks 4–5 cover story/card/marker UI and responsive treatment; Task 6 covers traces, final verification, and review integration.
- Placeholder scan: no implementation placeholders are used; every task names its files, expected interfaces, failure signal, and verification.
- Type consistency: internal `MarketStory` and `MarketStoryUpdate` remain server-only, `MarketStorySnapshot` and `MarketStoryUpdateSnapshot` cross the wire, and chart/card components consume only snapshot data.
