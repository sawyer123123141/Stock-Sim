# Early Player Progression V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the durable beginner loop with server-owned Independent Investor completion while preserving Research Focus as the only actual early capability.

**Architecture:** Store one monotonic `independentInvestorComplete` fact beside the existing persisted portfolio. Derive objective, stage, and onboarding completion from that fact plus the existing Research milestone and validated focus. Reconcile legacy state only when present runtime-valid focus and two present stock positions prove completion; all writes remain under the existing player/row lock and never make progression an input to the shared market.

**Tech Stack:** TypeScript, Node built-in test runner, React + Vite, Fastify/Vercel routes, existing Supabase locked persisted game state.

**Spec:** `docs/superpowers/specs/2026-08-30-early-player-progression-v1-design.md`

## Global Constraints

* Keep `firstStockPurchaseComplete` as the only Research Focus unlock source; do not add a mirrored unlock.
* Persist only `independentInvestorComplete`; do not add XP, levels, return gates, counters, capability arrays/registries, a table/migration, or browser-owned progress.
* Complete only after a valid focused stock and two distinct positive stock positions. Crypto, duplicate stock buys, price, profit, time, and clicks never count.
* Completion is player-owned and monotonic. It survives restart/sells/losses and never changes runtime, canonical time, RNG, pressure, market/public snapshots, or accounting.
* Legacy reconciliation uses only current authoritative state and the existing lock; never trade history or invented historical completion.
* Header stays compact: `NEXT OBJECTIVE` while guided; `INVESTOR STAGE / Independent Investor` after onboarding. No new screen, bar, modal, or spectacle.

---

## Current architecture map

| Concern | Existing owner | Required evolution |
| --- | --- | --- |
| Research unlock/focus | `apps/server/src/playerResearch.ts`; `PortfolioState.research` | Retain the first-stock source of truth; consume its validated focus. |
| Locked persistent state | `apps/server/src/persistentGameAuthority.ts` | Persist one early-completion fact in the existing private portfolio JSON/row lock. |
| Trade mutation | `apps/server/src/tradingService.ts` | Reconcile completion after a successful Buy updates the working portfolio. |
| Focus/safe projection | `apps/server/src/researchService.ts` | Sanitize focus, reconcile current legacy state, and derive the player-owned progression projection. |
| Shared contract | `packages/shared/src/research.ts` | Add stage/onboarding/optional final objective; no capability registry. |
| Client header | `apps/web/src/App.tsx`, `components/MarketHeader.tsx` | Render server-derived instruction or quiet stage in the existing center chip. |
| Regression tests | `tests/research-progression.test.mjs`, `tests/research-api.test.mjs`, `tests/web-research-progression-v1.test.mjs` | Cover transactions, reconciliation, isolation, transport, and compact UI. |

## Task 1: Define the minimal progression model and wire contract

**Files:**
- Create: `apps/server/src/playerProgression.ts`
- Modify: `packages/shared/src/research.ts`
- Modify: `packages/shared/src/index.ts`
- Modify: `apps/server/src/portfolioStore.ts`
- Modify: `apps/server/src/persistentGameAuthority.ts`
- Test: `tests/research-progression.test.mjs`

**Interfaces:**
- Produces:
  ```ts
  export interface PlayerEarlyProgressionState {
    independentInvestorComplete: boolean;
  }
  export interface ProgressionFacts {
    firstStockPurchaseComplete: boolean;
    hasValidFocus: boolean;
    distinctPositiveStockCount: number;
  }
  export function reconcileEarlyProgression(
    value: unknown, facts: ProgressionFacts
  ): PlayerEarlyProgressionState;
  ```
- Extends the player-owned `ResearchProgressionSnapshot` with `stage: "new-investor" | "independent-investor"`, `onboardingComplete: boolean`, and optional `objective`. Add only `build-small-stock-portfolio` to the existing objective union.

- [ ] **Step 1: Write failing response-shape tests**

Add assertions for fresh state, post-focus state, and final state:

```js
assert.deepEqual(await authority.getResearch(), {
  unlocked: false, coverageCapacity: 1,
  stage: "new-investor", onboardingComplete: false,
  objective: "make-first-stock-investment"
});
assert.equal(afterValidFocus.objective, "build-small-stock-portfolio");
assert.equal(afterCompletion.stage, "independent-investor");
assert.equal(afterCompletion.objective, undefined);
```

Run: `npm run build && node --test tests/research-progression.test.mjs`
Expected: FAIL because stage/onboarding fields and the final objective do not exist.

- [ ] **Step 2: Implement the smallest pure model**

Normalize missing/malformed progression to `{ independentInvestorComplete: false }`. Make reconciliation return true unchanged when already complete; otherwise return true only when all three facts qualify. It must take no time, trade-history, RNG, or market-mutation input. Add private `progression?` cloning/initial state support and shared types.

- [ ] **Step 3: Run focused verification**

Run: `npm run build && node --test tests/research-progression.test.mjs && npm run typecheck`
Expected: TypeScript compiles, while lifecycle assertions still fail specifically because Task 2 has not invoked the helper from authoritative Research/trade mutations.

- [ ] **Step 4: Commit**

```bash
git add packages/shared/src/research.ts packages/shared/src/index.ts apps/server/src/playerProgression.ts apps/server/src/portfolioStore.ts apps/server/src/persistentGameAuthority.ts tests/research-progression.test.mjs
git commit -m "feat: add early progression state"
```

## Task 2: Reconcile and complete under authoritative mutations

**Files:**
- Modify: `apps/server/src/researchService.ts`
- Modify: `apps/server/src/tradingService.ts`
- Modify: `apps/server/src/playerResearch.ts`
- Modify: `tests/research-progression.test.mjs`
- Modify: `tests/research-api.test.mjs`

**Interfaces:**
- Consumes `reconcileEarlyProgression` and runtime `researchBriefForAsset` to prove focus validity.
- Produces a `ResearchProgressionSnapshot` with three guided states or final `stage: "independent-investor"` and no objective.

- [ ] **Step 1: Write failing lifecycle and reconciliation tests**

Use the real persistent authority fixtures:

```js
await authority.executeTrade({ assetId: "nova", side: "buy", quantity: 1 });
await authority.setResearchFocus({ assetId: "nova" });
await authority.executeTrade({ assetId: "luma", side: "buy", quantity: 1 });
assert.equal((await authority.getResearch()).stage, "independent-investor");

await authority.executeTrade({ assetId: "nova", side: "buy", quantity: 1 });
await authority.executeTrade({ assetId: "luma", side: "buy", quantity: 1 });
await authority.setResearchFocus({ assetId: "nova" });
assert.equal((await authority.getResearch()).onboardingComplete, true);
```

Add independent tests for same-stock twice, stock plus crypto, stale/crypto focus, sell/loss/restart persistence, and rejected mutations. Seed legacy portfolio state directly and prove:
- valid focus plus two current stocks reconciles;
- only one current stock does not;
- stock plus crypto does not;
- stale/invalid focus does not; and
- a reconciliation call changes neither runtime/market/RNG/canonical time/pressure nor portfolio cash/positions.

Run: `npm run build && node --test tests/research-progression.test.mjs tests/research-api.test.mjs`
Expected: FAIL because current service/trading code never writes or projects the final milestone.

- [ ] **Step 2: Implement one facts resolver**

Add a narrow server helper that normalizes Research state, resolves focus through `runtime.researchBriefForAsset`, counts only positive positions whose current runtime asset kind is `stock`, and calls `reconcileEarlyProgression`.

Use it:
1. in `getResearch` after focus sanitation (present-state legacy reconciliation);
2. in `setFocus` after replacing focus;
3. in `executeTrade` after a successful Buy updates position and first-stock milestone.

Each caller writes the returned private progression value in its existing working portfolio transaction. Rejected mutations never reach it. Sells leave a completed value unchanged. Reconciliation itself must not call `advanceTo`, record pressure, alter recovery state, or mutate shared projection.

- [ ] **Step 3: Derive the response**

Use exactly this priority:

```ts
if (!research.firstStockPurchaseComplete) return firstStockObjective;
if (!hasValidFocus) return chooseFocusObjective;
if (!progression.independentInvestorComplete) return buildPortfolioObjective;
return independentInvestorStageWithoutObjective;
```

Keep existing `unlocked`, `coverageCapacity`, active focus, and focused safe brief behavior. Do not send position counts, raw internals, recommendations, or capability lists.

- [ ] **Step 4: Verify and commit**

Run: `npm run build && node --test tests/research-progression.test.mjs tests/research-api.test.mjs tests/persistent-game-authority.test.mjs && npm run typecheck`
Expected: PASS, including restart and concurrent operation coverage.

```bash
git add apps/server/src/playerProgression.ts apps/server/src/playerResearch.ts apps/server/src/researchService.ts apps/server/src/tradingService.ts tests/research-progression.test.mjs tests/research-api.test.mjs
git commit -m "feat: complete early investor progression"
```

## Task 3: Render the header transition

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/components/MarketHeader.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `tests/web-research-progression-v1.test.mjs`
- Modify: `tests/web-static.test.mjs`

**Interfaces:**
- Consumes the server-owned optional objective, stage, and onboarding completion from Task 2.
- Produces one existing center header chip: either objective copy or stage copy.

- [ ] **Step 1: Write failing UI/source tests**

```js
assert.match(header, /build-small-stock-portfolio/);
assert.match(header, /INVESTOR STAGE/);
assert.match(header, /Independent Investor/);
assert.doesNotMatch(header, /XP|level|progress bar|achievement/i);
assert.match(styles, /@media \(max-width: 560px\)/);
```

Run: `node --test tests/web-research-progression-v1.test.mjs tests/web-static.test.mjs`
Expected: FAIL because the header currently requires an objective and has no stage state/copy.

- [ ] **Step 2: Implement the smallest header branch**

Pass the full player projection or three derived fields explicitly. Render:

```tsx
{onboardingComplete ? (
  <div className="objective-chip objective-chip-stage" aria-label="Investor stage">
    <span>INVESTOR STAGE</span><strong>Independent Investor</strong>
  </div>
) : (
  <div className="objective-chip" aria-label="Next objective">...</div>
)}
```

Add only CSS needed to preserve existing header wrapping/no overflow at 560px and approximately 390px. Do not add a panel, route, progress bar, or animation spectacle.

- [ ] **Step 3: Verify and commit**

Run: `node --test tests/web-research-progression-v1.test.mjs tests/web-static.test.mjs && npm run build:web && npm run typecheck`
Expected: PASS; stock/crypto tabs and keyboard controls remain unchanged.

```bash
git add apps/web/src/App.tsx apps/web/src/components/MarketHeader.tsx apps/web/src/styles.css tests/web-research-progression-v1.test.mjs tests/web-static.test.mjs
git commit -m "feat: show independent investor stage"
```

## Task 4: Final acceptance and review PR

**Files:**
- Modify only files required by failing/absent coverage from Tasks 1–3.
- Test: `tests/research-progression.test.mjs`, `tests/research-api.test.mjs`, `tests/web-research-progression-v1.test.mjs`.

- [ ] **Step 1: Fill only missing acceptance coverage**

Before any further code, prove fresh sequence; stock vs crypto; valid focus; different vs same stock; both action orders; sell/loss/restart; malformed focus; current-state legacy reconciliation and its four counterexamples; concurrent mutations; shared-market/RNG/time/pressure/public-snapshot isolation; and header/mobile static behavior. Record existing tests rather than duplicating them if they already prove the behavior.

- [ ] **Step 2: Run final verification and scope review**

```bash
npm test
npm run typecheck
git diff --check origin/main...HEAD
npm run build:web
git diff --name-only origin/main...HEAD
```

Expected: all pass. Diff is limited to player progression, header treatment, shared types, tests, amended spec, and this plan; it contains no simulation, story, relationship, dependency, migration, or unrelated UI change.

- [ ] **Step 3: Perform legitimate visual verification if available**

Use local browser only if reachable, otherwise an already-authenticated Vercel preview/share path. Check desktop and approximately 390px for all three guided states and Independent Investor, no horizontal overflow, no console errors, retained Portfolio/Cash rhythm, usable stock/crypto switching, and no new task/dashboard panel. If blocked, record the exact environment/URL and do not claim a visual pass.

- [ ] **Step 4: Commit remaining tests, push, and open review-only PR**

```bash
git add tests/research-progression.test.mjs tests/research-api.test.mjs tests/web-research-progression-v1.test.mjs tests/web-static.test.mjs
git commit -m "test: cover early progression boundaries"
git push -u origin codex/early-player-progression-v1
gh pr create --base main --head codex/early-player-progression-v1 --title "feat: add early player progression"
```

The PR body must state: no XP/return/trade-count gates; one persisted final milestone; atomic stock/focus/two-stock completion; present-state-only legacy reconciliation; no generic capability registry; shared-market isolation; end-of-onboarding header treatment; exact test count; typecheck/build/diff; CI/Vercel; and any honestly blocked visual verification. Do not merge.

## Plan self-review

* **Coverage:** Tasks 1–2 cover the one canonical milestone, transactions, both action orders, restart/loss behavior, legacy reconciliation, concurrency, and isolation. Task 3 covers the only UI surface. Task 4 verifies final scope and integration.
* **No fake machinery:** every task forbids XP, registry/arrays, extra coverage, specialist/operations UI, score, money/currency, simulation changes, and persistence expansion.
* **Type consistency:** Task 1 defines `PlayerEarlyProgressionState`, `ProgressionFacts`, `reconcileEarlyProgression`, stage, and the final objective before later tasks consume them.
* **Legacy safety:** Task 2 distinguishes present provable completion from missing history and proves reconciliation itself cannot alter market/runtime state.
