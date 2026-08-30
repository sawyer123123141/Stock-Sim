# Market Understanding V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clarify existing Market Read, Why the Move, and public chart-story context without expanding the default market surface or changing simulation behavior.

**Architecture:** Keep Market Read, objective placement, tab hierarchy, and public contracts intact. Add deterministic server-side reason compression in the simulation explanation projection, then update only the existing overview components to expose the compact/expanded relationship and marker context accessibly.

**Tech Stack:** TypeScript, React 19, Vite, Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-08-30-market-understanding-v1-design.md`

## Global Constraints

- Do not change market timing, prices, event values, investor weights, expectation updates, relationship coefficients, trades, or API contracts.
- Do not expose raw pressure, fundamentals, expectations, pricing state, hidden effects, relationship values, RNG, or future story data.
- Keep default overview content compact; Company, Research, and Stories remain on demand.
- Preserve crypto behavior and exclude company-only explanations from crypto.

---

### Task 1: Deterministic movement-reason compression

**Files:**
- Modify: `packages/sim/src/explain.ts`
- Test: `tests/explain.test.mjs`

**Interfaces:**
- Consumes: `MovementContribution[]`
- Produces: existing `MovementReason[]` with no contract change

- [ ] **Step 1: Write failing tests**

```js
assert.deepEqual(
  explainMovement([relationshipDown, demandDown, momentumDown, sectorUp]).map((reason) => reason.code),
  ["relationship", "sector"]
);
assert.deepEqual(
  explainMovement([relationshipDown, demandUp]).map((reason) => reason.code),
  ["relationship", "demand"]
);
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm run build; node --test tests/explain.test.mjs`

- [ ] **Step 3: Implement the smallest deterministic compression**

```ts
const informationReason = item.code === "news" || item.code === "relationship";
const followThrough = item.code === "demand" || item.code === "momentum";
// Suppress only same-direction follow-through when an information reason is present.
```

- [ ] **Step 4: Run focused verification**

Run: `npm run build; node --test tests/explain.test.mjs`

### Task 2: Compact accessible explanation and public marker detail

**Files:**
- Modify: `apps/web/src/components/MovementStory.tsx`
- Modify: `apps/web/src/components/PriceChart.tsx`
- Modify: `apps/web/src/styles.css`
- Test: `tests/web-market-experience-v1.test.mjs`
- Test: `tests/web-price-chart-markers.test.mjs`

**Interfaces:**
- Consumes: existing public `AssetSnapshot.reasons` and `MarketStoryUpdateSnapshot`
- Produces: accessible compact expansion and public-only marker detail

- [ ] **Step 1: Write failing UI-source regressions**

```js
assert.match(movement, /More context/);
assert.match(movement, /aria-expanded/);
assert.match(chart, /activeMarker\.update\.summary/);
assert.doesNotMatch(renderedSurface, /reactionEffect|expectationDeltas|pricedExpectations/);
```

- [ ] **Step 2: Run focused browser-source tests and confirm failure**

Run: `node --test tests/web-market-experience-v1.test.mjs tests/web-price-chart-markers.test.mjs`

- [ ] **Step 3: Implement the smallest presentation changes**

```tsx
<span className="movement-context-action">{expanded ? "Less context" : "More context"}</span>
{activeMarker && <p>{activeMarker.update.summary}</p>}
```

- [ ] **Step 4: Run focused verification**

Run: `node --test tests/web-market-experience-v1.test.mjs tests/web-price-chart-markers.test.mjs`

### Task 3: Regression boundary and responsive verification

**Files:**
- Test: `tests/web-market-experience-v1.test.mjs`
- Test: `tests/web-static.test.mjs`

- [ ] **Step 1: Add failing regressions for Market Read/public isolation, header objective placement, separate Story and movement components, crypto compatibility, and stable ordering**
- [ ] **Step 2: Confirm focused tests fail because the assertions are absent**
- [ ] **Step 3: Add only the required assertions or minimal code fixes**
- [ ] **Step 4: Run full verification**

Run: `npm test; npm run typecheck; git diff --check; npm run build:web`

### Task 4: Manual UI verification and PR

**Files:**
- No implementation files unless manual verification reveals a scoped regression.

- [ ] **Step 1: Run the server and Vite client; verify the local application on desktop and 390px.**
- [ ] **Step 2: Check Market Read, compact/expanded Why the Move, public marker hover/focus/tap detail, direct and related stories, crypto, objective header, overflow, keyboard behavior, and console output.**
- [ ] **Step 3: Inspect the full diff against `main`, commit, push, open one PR, and wait for exact-head Actions and Vercel.**
