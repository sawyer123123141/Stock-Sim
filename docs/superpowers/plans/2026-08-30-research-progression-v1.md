# Research Progression V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Give the demo player one persistent, server-authoritative stock Research Focus that reveals a safe current qualitative brief without changing the shared market or making recommendations.

**Architecture:** The shared market projection stops serializing stock research. A small player-owned record lives inside the existing private persisted portfolio JSON, so the existing Postgres row lock commits stock-purchase unlocks, focus changes, and portfolio changes atomically. A server-only research service projects the brief from the current runtime only for the active focus; Fastify/Vercel expose that projection through player-scoped routes, and the browser uses it for the existing Research tab and compact objective chip.

**Tech Stack:** TypeScript, React 19, Fastify 5, Vercel Node handlers, Postgres JSON persistence through the existing \`postgres\` row-lock store, Node built-in test runner, Vite.

**Spec:** \`docs/superpowers/specs/2026-08-30-research-progression-v1-design.md\`

## Current architecture map

* \`apps/server/src/persistentGameAuthority.ts\` restores the deterministic runtime inside one \`LockedGameStore.transact\` call, advances only canonical ticks, and writes \`runtime\`, \`portfolio\`, and \`nextTradeId\` together. \`apps/server/src/postgresGameStore.ts\` serializes that complete state through \`SELECT ... FOR UPDATE\`.
* \`apps/server/src/tradingService.ts\` is the only authority that mutates cash/positions. Its \`PortfolioStore.transact\` callback is the correct location to mark the first completed stock purchase because a failure never commits the working portfolio.
* \`packages/shared/src/market.ts\` currently exposes \`AssetSnapshot.research\`; \`packages/sim/src/market.ts\` calls \`toStockResearchSnapshot\` for every stock. \`packages/sim/src/research.ts\` already owns the useful deterministic broad classifications.
* \`apps/server/src/marketRuntime.ts\` owns private \`AssetState\` and can expose a narrow server-only focused-brief method without sending private state through \`MarketSnapshot\`.
* \`apps/server/src/app.ts\`, \`tradingRoutes.ts\`, and \`marketRoutes.ts\` compose Fastify local endpoints. Vercel uses \`api/_authority.ts\`, \`api/market.ts\`, \`api/portfolio.ts\`, \`api/trades.ts\`, and \`api/stories/[assetId].ts\` over the same persistent authority.
* \`apps/web/src/useMarketSession.ts\` currently loads/polls shared market data and keeps the browser-only owned-asset objective; \`MarketHeader.tsx\` renders that objective; \`ResearchPanel.tsx\` reads \`asset.research\` directly.
* \`tests/persistent-game-authority.test.mjs\` supplies the serialized lock fake/restart evidence; \`tests/trading-api.test.mjs\` tests Fastify trade responses; \`tests/market-experience-projection.test.mjs\` protects public serialization; web tests inspect focused UI/source behavior.

## Global constraints

* Do not change simulation values, canonical time, RNG consumption, active stories, relationship semantics, player pressure, or trade execution pricing.
* The normal shared \`MarketSnapshot\`, polling, and WebSocket contracts must contain no qualitative Company Outlook or Market Expectations brief.
* Public Company identity, price/chart, Market Read, Why the Move, public stories/history/markers, and basic relationship names/types/importances remain shared and free.
* Persist one source of truth: \`firstStockPurchaseComplete\`; derive \`unlocked\`, coverage capacity \`1\`, and the compact objective from it plus \`activeStockAssetId\`.
* Only a successful buy that establishes a positive stock position sets that milestone; crypto, failed/rejected buys, and later sales cannot change it incorrectly.
* One active focus must be a valid stock, need not be owned, switches immediately, and cannot mutate market/portfolio/trade data other than player research state.
* Research responses must omit raw fundamentals/expectations/priced expectations/gaps, future/private story data, effects, coefficients, investor/pressure data, RNG/recovery data, recommendations, forecasts, and valuation fields.
* Do not add a DB table/migration: player research belongs in the already private persisted portfolio JSON. Do not add dependencies, currencies, timers, XP, levels, topic jobs, specialists, departments, ownership, or crypto company research.

---

### Task 1: Define the separated public contracts and remove global research transport

**Files:**
- Create: \`packages/shared/src/research.ts\`
- Modify: \`packages/shared/src/index.ts\`
- Modify: \`packages/shared/src/market.ts\`
- Modify: \`packages/sim/src/research.ts\`
- Modify: \`packages/sim/src/index.ts\`
- Modify: \`packages/sim/src/market.ts\`
- Test: \`tests/market-experience-projection.test.mjs\`
- Test: \`tests/research-progression.test.mjs\`

**Interfaces:**
- Produces \`ResearchProgressionSnapshot\`, \`ResearchFocusIntent\`, \`ResearchObjective\`, \`FocusedStockResearchBrief\`, and \`ResearchConnectionContextSnapshot\` in \`packages/shared/src/research.ts\`.
- Produces \`toFocusedStockResearchBrief(asset, assets): FocusedStockResearchBrief | undefined\` in \`packages/sim/src/research.ts\`; it reuses \`classifyCompanyResearch\` and \`classifyExpectationResearch\` and derives context only from public-safe relationship snapshots.
- Removes \`research?: StockResearchSnapshot\` from \`AssetSnapshot\` and stops \`toMarketSnapshot\` from adding it.

- [ ] **Step 1: Write the failing test.**

\`\`\`js
test("shared MarketSnapshot omits qualitative research while the focused brief keeps broad deterministic labels", () => {
  const market = createSeedMarket();
  const shared = toMarketSnapshot(market, 1_000);
  const nova = market.assets.find((asset) => asset.id === "nova");
  const brief = toFocusedStockResearchBrief(nova, market.assets);

  assert.equal(JSON.stringify(shared).includes('"research"'), false);
  assert.deepEqual(Object.keys(brief.company).sort(), [
    "competitivePosition", "financialHealth", "growth", "profitability", "reputation"
  ]);
  assert.deepEqual(Object.keys(brief.expectations).sort(), [
    "demand", "execution", "growth", "profitability"
  ]);
  assert.doesNotMatch(JSON.stringify(brief), /fundamentals|pricingState|pricedExpectations|weight|effect|RNG/i);
});
\`\`\`

- [ ] **Step 2: Run the test to verify it fails.**

Run: \`npm test -- --test-name-pattern="shared MarketSnapshot omits qualitative research"\`

Expected: FAIL because \`AssetSnapshot.research\` is still serialized and/or the focused-brief API is absent, not because of test setup.

- [ ] **Step 3: Write the minimal implementation.**

\`\`\`ts
export type ResearchObjective = "make-first-stock-investment" | "choose-research-focus" | "broaden-investing";

export interface ResearchProgressionSnapshot {
  unlocked: boolean;
  coverageCapacity: 1;
  objective: ResearchObjective;
  activeStockAssetId?: string;
  brief?: FocusedStockResearchBrief;
}

export interface ResearchFocusIntent { assetId: string; }
\`\`\`

Keep \`StockResearchSnapshot\` as the internal/public-brief label shape if useful, but remove it from \`AssetSnapshot\`. \`toFocusedStockResearchBrief\` returns \`undefined\` for crypto/missing company state and contains only qualitative company, expectations, and context fields.

- [ ] **Step 4: Run focused tests to verify they pass.**

Run: \`npm test -- --test-name-pattern="shared MarketSnapshot omits qualitative research|research classification is deterministic"\`

Expected: PASS. Existing threshold behavior stays covered.

- [ ] **Step 5: Commit.**

\`\`\`bash
git add packages/shared/src/research.ts packages/shared/src/index.ts packages/shared/src/market.ts packages/sim/src/research.ts packages/sim/src/index.ts packages/sim/src/market.ts tests/market-experience-projection.test.mjs tests/research-progression.test.mjs
git commit -m "feat: separate focused research from market snapshots"
\`\`\`

### Task 2: Persist one player-owned research milestone and focus atomically with trading

**Files:**
- Create: \`apps/server/src/playerResearch.ts\`
- Create: \`apps/server/src/researchService.ts\`
- Modify: \`apps/server/src/portfolioStore.ts\`
- Modify: \`apps/server/src/tradingService.ts\`
- Modify: \`apps/server/src/marketRuntime.ts\`
- Modify: \`apps/server/src/persistentGameAuthority.ts\`
- Test: \`tests/research-progression.test.mjs\`
- Test: \`tests/persistent-game-authority.test.mjs\`

**Interfaces:**
- \`PlayerResearchState\` is private server state with only \`firstStockPurchaseComplete: boolean\` and optional \`activeStockAssetId\`; capacity, unlocked state, and objective are derived.
- \`normalizePlayerResearchState(value): PlayerResearchState\`, \`researchObjective(state): ResearchObjective\`, and \`markFirstStockPurchase(state): PlayerResearchState\` are pure server helpers.
- \`ResearchService\` exposes \`getResearch(playerId): Promise<ResearchProgressionSnapshot>\` and \`setFocus(playerId, intent: ResearchFocusIntent): Promise<ResearchProgressionSnapshot>\`.
- \`MarketRuntime.researchBriefForAsset(assetId): FocusedStockResearchBrief | undefined\` is server-only.
- \`PersistentGameAuthority\` adds \`getResearch()\` and \`setResearchFocus(intent)\` inside its existing outer transaction.

- [ ] **Step 1: Write failing authority tests.**

\`\`\`js
test("only a successful stock buy unlocks persisted Research and a later sale cannot relock it", async () => {
  const session = createClockedAuthority();
  assert.deepEqual(await session.authority.getResearch(), {
    unlocked: false, coverageCapacity: 1, objective: "make-first-stock-investment"
  });
  await assert.rejects(() => session.authority.setResearchFocus({ assetId: "nova" }), /Research is not unlocked/);
  await session.authority.executeTrade({ assetId: "pulse", side: "buy", quantity: 1 });
  assert.equal((await session.authority.getResearch()).unlocked, false);
  await session.authority.executeTrade({ assetId: "nova", side: "buy", quantity: 1 });
  await session.authority.executeTrade({ assetId: "nova", side: "sell", quantity: 1 });
  assert.equal((await createPersistentGameAuthority(session.store, () => 0).getResearch()).unlocked, true);
});

test("focused research accepts any valid stock, rejects crypto or unknown input, and leaves prior focus intact", async () => {
  const session = createClockedAuthority();
  await session.authority.executeTrade({ assetId: "nova", side: "buy", quantity: 1 });
  const focused = await session.authority.setResearchFocus({ assetId: "hgrid" });
  assert.equal(focused.activeStockAssetId, "hgrid");
  await assert.rejects(() => session.authority.setResearchFocus({ assetId: "pulse" }), /stock/i);
  await assert.rejects(() => session.authority.setResearchFocus({ assetId: "missing" }), /not found/i);
  assert.equal((await session.authority.getResearch()).activeStockAssetId, "hgrid");
});
\`\`\`

- [ ] **Step 2: Run the focused tests to verify they fail.**

Run: \`npm test -- --test-name-pattern="successful stock buy unlocks persisted Research|focused research accepts"\`

Expected: FAIL because \`getResearch\` and \`setResearchFocus\` do not exist.

- [ ] **Step 3: Write the minimal atomic state implementation.**

\`\`\`ts
interface PortfolioState {
  playerId: string;
  cashCents: number;
  positions: Record<string, StoredPosition>;
  research?: PlayerResearchState;
}

if (intent.side === "buy" && asset.kind === "stock") {
  portfolio.research = markFirstStockPurchase(portfolio.research);
}
\`\`\`

Normalize absent legacy \`portfolio.research\` as locked/unfocused. Mark only inside the already-successful \`PortfolioStore.transact\` working copy after the positive stock position is established. \`ResearchService.setFocus\` validates unlock, asset existence, and \`kind === "stock"\` before changing only \`portfolio.research.activeStockAssetId\`; invalid cases throw typed \`ResearchError\` without committing any focus change.

- [ ] **Step 4: Wire persistent reads/focus through the existing lock.**

Within \`withRuntime\`, construct the service over \`new InMemoryPortfolioStore(0, state.portfolio)\`, then assign the stored private portfolio back to \`state.portfolio\` exactly as \`executeTrade\` already does. Add tests that snapshot runtime recovery, shared market, and public portfolio before/after focus changes and prove only private player research differs.

- [ ] **Step 5: Run focused tests and commit.**

Run: \`npm test -- --test-name-pattern="Research|research|focus|persistent authority serializes"\`

Expected: PASS for unlock, failed/rejected/crypto behavior, sales, restart, focus moves, validation, atomic state, no RNG/time/market/portfolio changes, and legacy hydration.

\`\`\`bash
git add apps/server/src/playerResearch.ts apps/server/src/researchService.ts apps/server/src/portfolioStore.ts apps/server/src/tradingService.ts apps/server/src/marketRuntime.ts apps/server/src/persistentGameAuthority.ts tests/research-progression.test.mjs tests/persistent-game-authority.test.mjs
git commit -m "feat: persist player research focus"
\`\`\`

### Task 3: Expose only the player-owned research projection through local and hosted routes

**Files:**
- Create: \`apps/server/src/researchRoutes.ts\`
- Modify: \`apps/server/src/app.ts\`
- Modify: \`apps/server/src/server.ts\`
- Create: \`api/research.ts\`
- Create: \`api/research/focus.ts\`
- Test: \`tests/research-api.test.mjs\`
- Test: \`tests/research-progression.test.mjs\`

**Interfaces:**
- \`GET /api/research\` returns \`ResearchProgressionSnapshot\` for the configured player.
- \`POST /api/research/focus\` accepts only \`ResearchFocusIntent\` and returns the new \`ResearchProgressionSnapshot\`.
- \`ResearchError\` maps \`RESEARCH_LOCKED\` to \`409\`, \`RESEARCH_ASSET_NOT_FOUND\` to \`404\`, and \`RESEARCH_STOCK_REQUIRED\`/malformed focus input to \`400\` in Fastify and Vercel.
- The Vercel handlers call \`hostedAuthority()\` only; they never expose persistence/recovery values.

- [ ] **Step 1: Write failing Fastify route tests.**

\`\`\`js
test("research routes expose only the focused brief and reject unauthorized focus input", async () => {
  const initial = await server.app.inject({ method: "GET", url: "/api/research" });
  assert.deepEqual(initial.json(), {
    unlocked: false, coverageCapacity: 1, objective: "make-first-stock-investment"
  });
  const locked = await server.app.inject({ method: "POST", url: "/api/research/focus", payload: { assetId: "nova" } });
  assert.equal(locked.statusCode, 409);
  await server.app.inject({ method: "POST", url: "/api/trades", payload: { assetId: "nova", side: "buy", quantity: 1 } });
  const focused = await server.app.inject({ method: "POST", url: "/api/research/focus", payload: { assetId: "hgrid" } });
  assert.equal(focused.statusCode, 200);
  assert.equal(focused.json().brief.assetId, "hgrid");
  assert.equal(JSON.stringify(focused.json()).includes('"assetId":"nova"'), false);
});
\`\`\`

- [ ] **Step 2: Run the route test to verify it fails.**

Run: \`npm test -- --test-name-pattern="research routes expose only"\`

Expected: FAIL with missing-route behavior.

- [ ] **Step 3: Register Fastify and Vercel routes with the same authority semantics.**

Use \`ResearchRouteOptions\` over \`ResearchService\` for Fastify. Keep the existing local runtime/store available long enough to create the service over the same \`PortfolioStore\` as trading. For Vercel, parse JSON, call the persistent authority, map typed errors to the listed stable codes, and set JSON content type.

- [ ] **Step 4: Add/run privacy and market-isolation assertions.**

\`\`\`js
const json = JSON.stringify(focused.json());
assert.equal(json.includes('"assetId":"nova"'), false, "unfocused NOVA must not appear in a HGRD brief");
assert.doesNotMatch(json, /fundamentals|pricedExpectations|outcome|surprise|effect|weight|rng|runtime|recommend|forecast/i);
assert.equal(JSON.stringify(await authority.getMarket()), JSON.stringify(sharedBeforeFocus));
\`\`\`

Run: \`npm test -- --test-name-pattern="research routes|focused research accepts|shared MarketSnapshot"\`

Expected: PASS.

- [ ] **Step 5: Commit.**

\`\`\`bash
git add apps/server/src/researchRoutes.ts apps/server/src/app.ts apps/server/src/server.ts api/research.ts api/research/focus.ts tests/research-api.test.mjs tests/research-progression.test.mjs
git commit -m "feat: expose player research projection"
\`\`\`

### Task 4: Replace browser-session objectives and global research UI with player research state

**Files:**
- Modify: \`apps/web/src/api.ts\`
- Modify: \`apps/web/src/useMarketSession.ts\`
- Modify: \`apps/web/src/App.tsx\`
- Modify: \`apps/web/src/components/MarketHeader.tsx\`
- Modify: \`apps/web/src/components/ResearchPanel.tsx\`
- Modify: \`apps/web/src/styles.css\`
- Delete: \`apps/web/src/firstSessionProgress.ts\`
- Modify: \`tsconfig.json\`
- Test: \`tests/web-market-experience-v1.test.mjs\`
- Create: \`tests/web-research-progression-v1.test.mjs\`
- Modify: \`tests/web-market-network-v1.test.mjs\`

**Interfaces:**
- \`fetchResearchProgression(): Promise<ResearchProgressionSnapshot>\` and \`setResearchFocus(intent): Promise<ResearchProgressionSnapshot>\` call the new player routes.
- \`MarketSession\` exposes \`research\`, \`researchPending\`, \`researchError\`, and \`focusResearch(assetId)\`; it removes all browser-owned objective updates.
- \`MarketHeader\` accepts \`objective: ResearchObjective\` and renders one compact objective sentence.
- \`ResearchPanel\` accepts \`{ asset, research, pending, error, onFocus }\`; crypto never renders the company-only panel because \`AssetTabs\` continues omitting that tab.

- [ ] **Step 1: Write failing client/UI source tests.**

\`\`\`js
test("Research UI renders locked, unfocused, and focused states from player research instead of AssetSnapshot", async () => {
  const [session, panel, header, api, app] = await Promise.all([
    text("apps/web/src/useMarketSession.ts"),
    text("apps/web/src/components/ResearchPanel.tsx"),
    text("apps/web/src/components/MarketHeader.tsx"),
    text("apps/web/src/api.ts"),
    text("apps/web/src/App.tsx")
  ]);
  assert.match(api, /fetchResearchProgression/);
  assert.match(api, /setResearchFocus/);
  assert.match(panel, /first stock investment/i);
  assert.match(panel, /Research this company/);
  assert.match(panel, /Move research focus/);
  assert.match(header, /make-first-stock-investment/);
  assert.doesNotMatch(session, /firstSessionOwnedAssetCount|rememberOwnedAssetIds/);
  assert.doesNotMatch(panel, /asset\\.research/);
  assert.match(app, /focusResearch/);
});
\`\`\`

- [ ] **Step 2: Run the UI test to verify it fails.**

Run: \`npm test -- --test-name-pattern="Research UI renders locked"\`

Expected: FAIL because the client still depends on \`asset.research\` and browser-session owned assets.

- [ ] **Step 3: Write the minimal player-state client flow.**

On initial load, fetch market, portfolio, and research together. After each accepted authoritative poll, refresh the player research projection without modifying the shared market snapshot; ignore superseded response writes with the same cancellation/request-generation pattern used for session loading. After a successful trade, replace/refresh the returned research state so the first stock buy immediately advances the header objective. Focus action posts only \`{ assetId }\`, then replaces the returned player research state.

\`\`\`tsx
if (!research.unlocked) return <p>Research becomes available after your first stock investment.</p>;
if (research.activeStockAssetId !== asset.id) return <button onClick={() => onFocus(asset.id)}>Research this company</button>;
return <>{/* qualitative brief rows, compact context, move-focus action */}</>;
\`\`\`

Use real buttons, labelled busy/error feedback, and existing compact row styles. Preserve public Company connection entries. Do not add a Research tab for crypto, a progress bar, or a modal.

- [ ] **Step 4: Add/run focused client regressions.**

Test header copy for every derived objective, focused-company identification, move action, stock/crypto tab behavior, keyboard-focusable buttons, and existing 390px CSS no-overflow rules. Update prior Market Experience/Network tests to assert the player-state contract instead of global \`AssetSnapshot.research\`.

Run: \`npm test -- --test-name-pattern="Research UI|Market Experience V1|Market Network surfaces"\`

Expected: PASS with no production use of \`firstSessionProgress\` or \`asset.research\`.

- [ ] **Step 5: Commit.**

\`\`\`bash
git add apps/web/src/api.ts apps/web/src/useMarketSession.ts apps/web/src/App.tsx apps/web/src/components/MarketHeader.tsx apps/web/src/components/ResearchPanel.tsx apps/web/src/styles.css tsconfig.json tests/web-market-experience-v1.test.mjs tests/web-research-progression-v1.test.mjs tests/web-market-network-v1.test.mjs
git rm apps/web/src/firstSessionProgress.ts
git commit -m "feat: add focused research progression UI"
\`\`\`

### Task 5: Verify, inspect, and open one review-only PR

**Files:**
- Modify only if required by verification: files listed in Tasks 1–4 and their tests.
- Do not modify: event catalog/tuning, investor/repricing code, Story Lifecycle behavior, relationship mappings, Supabase schema/migrations, or unrelated UI.

**Interfaces:**
- Final shared market contract has no \`AssetSnapshot.research\`.
- Final player projection has one derived objective, capacity \`1\`, one optional focused brief, and no private/future fields.

- [ ] **Step 1: Run focused regression suites.**

Run:

\`\`\`bash
npm test -- --test-name-pattern="Research|research|focus|MarketSnapshot|persistent authority|market isolation"
\`\`\`

Expected: all matching tests pass, including legacy hydration, failed/crypto/sale behavior, restart, focus validation, public isolation, private-field absence, relationship context, and UI state coverage.

- [ ] **Step 2: Run required full gates on the final head.**

Run:

\`\`\`bash
npm test
npm run typecheck
git diff --check main...HEAD
npm run build:web
\`\`\`

Expected: exit status \`0\` for every command. Record the final Node test count.

- [ ] **Step 3: Self-review against the approved acceptance criteria.**

Run:

\`\`\`bash
git diff --check main...HEAD
git diff --stat main...HEAD
git diff main...HEAD -- packages/shared/src packages/sim/src apps/server/src apps/web/src api tests
\`\`\`

Verify: no global research serialization; no duplicate unlock flag; stock-buy-only atomic mark; focus has no runtime/RNG/time/portfolio side effects; relationships remain public in Company; focus context is bounded/public-safe; client no longer owns objective authority; crypto has no company Research; no unrelated simulation or schema change.

- [ ] **Step 4: Perform manual verification only through a legitimate browser surface.**

Run local server/client if browser access is available; otherwise use an authenticated/shareable Vercel preview. Check desktop and approximately 390px for locked/unfocused/focused Research, immediate focus move, header objective progression, stock/crypto tabs, no horizontal overflow, and console errors. If neither permitted surface is reachable, record the exact external error/URL and do not claim a visual pass.

- [ ] **Step 5: Commit final review-only changes, push, and open the PR without merging.**

\`\`\`bash
git add -A -- ':!package-lock.pre-hosted-preview-backup.json' ':!temp-doc-backup'
git commit -m "test: cover research progression boundaries"
git push -u origin codex/research-progression-v1
gh pr create --base main --head codex/research-progression-v1 --title "feat: add player research focus"
\`\`\`

The PR body must summarize player-owned state, first-stock atomic unlock, focus validation, shared-market isolation, safe projection/privacy, UI/objective behavior, exact tests, build/typecheck/diff evidence, CI/Vercel evidence, and any honestly blocked visual verification. Wait for fresh exact-head GitHub Actions and Vercel; do not merge.

## Plan self-review

* **Shared vs player ownership:** Tasks 1 and 3 remove shared research transport; Tasks 2–4 add only player-owned state/projection. Task 5 compares market snapshots before/after focus.
* **Single unlock source:** Task 2 persists only \`firstStockPurchaseComplete\`; objective/unlocked/capacity are derived. Its trade mutation occurs inside the existing working portfolio transaction and is written by the existing outer Postgres lock.
* **Onboarding:** Task 2 establishes the stock-only milestone; Task 4 derives the compact objective sequence. Crypto does not advance it; no quest framework is introduced.
* **Privacy:** Task 1 removes global labels; Tasks 2–3 scope/project one focused brief; every suite asserts absence of private/future fields and recommendations.
* **Relationships/history:** Task 1 context uses only public-safe relationship summaries. Task 4 preserves Company entries and Story surfaces, while Task 5 checks bounded/non-pending behavior.
* **Future compatibility:** the private state is keyed to the portfolio player record and the public API is player-owned, so later account IDs/specialists can extend coverage without changing shared market ownership.
* **Scope:** no migration is necessary because the existing private \`portfolio\` JSON already persists player state under the same row lock. The plan touches no simulation tuning, story lifecycle, or new game systems.
* **Placeholder/type scan:** all named files, interfaces, routes, commands, error mappings, test assertions, and commit boundaries are defined in Tasks 1–5. \`ResearchProgressionSnapshot\`, \`ResearchFocusIntent\`, and \`FocusedStockResearchBrief\` are defined before later tasks consume them.
