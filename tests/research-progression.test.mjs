import test from "node:test";
import assert from "node:assert/strict";
import { createInitialGameState, createPersistentGameAuthority } from "../dist/apps/server/src/persistentGameAuthority.js";

class LockedMemoryStore {
  constructor(state) {
    this.state = structuredClone(state);
    this.queue = Promise.resolve();
  }

  async transact(mutation) {
    const previous = this.queue;
    let release;
    this.queue = new Promise((resolve) => { release = resolve; });
    await previous;
    try {
      return await mutation(this.state);
    } finally {
      release();
    }
  }
}

function createClockedAuthority(startedAtMs = 0) {
  let nowMs = startedAtMs;
  const store = new LockedMemoryStore(createInitialGameState(startedAtMs));
  return {
    store,
    authority: () => createPersistentGameAuthority(store, () => nowMs),
    setNow(value) { nowMs = value; }
  };
}

test("legacy player starts locked and only a successful stock buy unlocks persisted Research", async () => {
  const session = createClockedAuthority();
  const authority = session.authority();
  delete session.store.state.portfolio.research;

  assert.deepEqual(await authority.getResearch(), {
    unlocked: false,
    coverageCapacity: 1,
    stage: "new-investor",
    onboardingComplete: false,
    objective: "make-first-stock-investment"
  });
  await assert.rejects(
    () => authority.setResearchFocus({ assetId: "nova" }),
    /Research is not unlocked/
  );

  await authority.executeTrade({ assetId: "pulse", side: "buy", quantity: 1 });
  assert.equal((await authority.getResearch()).unlocked, false);

  await assert.rejects(
    () => authority.executeTrade({ assetId: "nova", side: "buy", quantity: 1_000 }),
    /Not enough cash/
  );
  assert.equal((await authority.getResearch()).unlocked, false);

  await authority.executeTrade({ assetId: "nova", side: "buy", quantity: 1 });
  assert.deepEqual(await authority.getResearch(), {
    unlocked: true,
    coverageCapacity: 1,
    stage: "new-investor",
    onboardingComplete: false,
    objective: "choose-research-focus"
  });

  await authority.executeTrade({ assetId: "nova", side: "sell", quantity: 1 });
  assert.equal((await session.authority().getResearch()).unlocked, true);
});

test("Research Focus accepts any stock, rejects crypto or unknown assets, and persists", async () => {
  const session = createClockedAuthority();
  const authority = session.authority();
  await authority.executeTrade({ assetId: "nova", side: "buy", quantity: 1 });

  const hgrid = await authority.setResearchFocus({ assetId: "hgrid" });
  assert.equal(hgrid.activeStockAssetId, "hgrid");
  assert.equal(hgrid.brief?.assetId, "hgrid");

  const luma = await authority.setResearchFocus({ assetId: "luma" });
  assert.equal(luma.activeStockAssetId, "luma");
  assert.equal(luma.brief?.assetId, "luma");

  await authority.setResearchFocus({ assetId: "hgrid" });

  await assert.rejects(
    () => authority.setResearchFocus({ assetId: "pulse" }),
    /stock/
  );
  await assert.rejects(
    () => authority.setResearchFocus({ assetId: "missing" }),
    /not found/
  );
  assert.equal((await authority.getResearch()).activeStockAssetId, "hgrid");

  const restarted = await session.authority().getResearch();
  assert.equal(restarted.activeStockAssetId, "hgrid");
  assert.equal(restarted.objective, "build-small-stock-portfolio");
});

test("Research Focus has no shared market, runtime, RNG, canonical-time, or portfolio effect", async () => {
  const session = createClockedAuthority();
  const authority = session.authority();
  await authority.executeTrade({ assetId: "nova", side: "buy", quantity: 1 });

  const marketBefore = await authority.getMarket();
  const runtimeBefore = structuredClone(session.store.state.runtime);
  const portfolioBefore = await authority.getPortfolio();
  const nextTradeIdBefore = session.store.state.nextTradeId;

  await authority.setResearchFocus({ assetId: "luma" });

  assert.deepEqual(await authority.getMarket(), marketBefore);
  assert.deepEqual(session.store.state.runtime, runtimeBefore);
  assert.deepEqual(await authority.getPortfolio(), portfolioBefore);
  assert.equal(session.store.state.nextTradeId, nextTradeIdBefore);
});

test("locked malformed Research state has no focus or brief and does not auto-focus after the first stock purchase", async () => {
  const session = createClockedAuthority();
  session.store.state.portfolio.research = {
    firstStockPurchaseComplete: false,
    activeStockAssetId: "nova"
  };
  const authority = session.authority();

  const locked = await authority.getResearch();
  assert.deepEqual(locked, {
    unlocked: false,
    coverageCapacity: 1,
    stage: "new-investor",
    onboardingComplete: false,
    objective: "make-first-stock-investment"
  });
  assert.doesNotMatch(JSON.stringify(locked), /activeStockAssetId|brief|company|expectations/i);

  await authority.executeTrade({ assetId: "nova", side: "buy", quantity: 1 });
  assert.deepEqual(await authority.getResearch(), {
    unlocked: true,
    coverageCapacity: 1,
    stage: "new-investor",
    onboardingComplete: false,
    objective: "choose-research-focus"
  });
});

test("unlocked stale crypto or missing Research Focus resolves to no focus and no brief", async () => {
  const session = createClockedAuthority();
  const authority = session.authority();
  await authority.executeTrade({ assetId: "nova", side: "buy", quantity: 1 });

  for (const activeStockAssetId of ["pulse", "missing"]) {
    session.store.state.portfolio.research = {
      firstStockPurchaseComplete: true,
      activeStockAssetId
    };
    const research = await authority.getResearch();
    assert.deepEqual(research, {
      unlocked: true,
      coverageCapacity: 1,
      stage: "new-investor",
      onboardingComplete: false,
      objective: "choose-research-focus"
    });
    assert.doesNotMatch(JSON.stringify(research), /activeStockAssetId|brief|company|expectations/i);
  }
});

test("early progression completes in either stock/focus order and does not regress after a sell", async () => {
  const focusFirst = createClockedAuthority();
  const focusFirstAuthority = focusFirst.authority();
  await focusFirstAuthority.executeTrade({ assetId: "nova", side: "buy", quantity: 1 });
  await focusFirstAuthority.setResearchFocus({ assetId: "nova" });
  assert.equal((await focusFirstAuthority.getResearch()).objective, "build-small-stock-portfolio");
  await focusFirstAuthority.executeTrade({ assetId: "luma", side: "buy", quantity: 1 });
  assert.deepEqual(await focusFirstAuthority.getResearch(), {
    unlocked: true,
    coverageCapacity: 1,
    stage: "independent-investor",
    onboardingComplete: true,
    activeStockAssetId: "nova",
    brief: (await focusFirstAuthority.getResearch()).brief
  });
  await focusFirstAuthority.executeTrade({ assetId: "luma", side: "sell", quantity: 1 });
  assert.equal((await focusFirst.authority().getResearch()).stage, "independent-investor");

  const stocksFirst = createClockedAuthority();
  const stocksFirstAuthority = stocksFirst.authority();
  await stocksFirstAuthority.executeTrade({ assetId: "nova", side: "buy", quantity: 1 });
  await stocksFirstAuthority.executeTrade({ assetId: "luma", side: "buy", quantity: 1 });
  assert.equal((await stocksFirstAuthority.getResearch()).objective, "choose-research-focus");
  await stocksFirstAuthority.setResearchFocus({ assetId: "nova" });
  assert.equal((await stocksFirst.authority().getResearch()).onboardingComplete, true);
});

test("early progression excludes duplicate stock buys and crypto holdings", async () => {
  const session = createClockedAuthority();
  const authority = session.authority();
  await authority.executeTrade({ assetId: "nova", side: "buy", quantity: 2 });
  await authority.setResearchFocus({ assetId: "nova" });
  assert.equal((await authority.getResearch()).objective, "build-small-stock-portfolio");
  await authority.executeTrade({ assetId: "pulse", side: "buy", quantity: 1 });
  assert.equal((await authority.getResearch()).onboardingComplete, false);
});

test("concurrent stock purchase and focus changes serialize to one valid progression state", async () => {
  const session = createClockedAuthority();
  const authority = session.authority();
  await authority.executeTrade({ assetId: "nova", side: "buy", quantity: 1 });

  await Promise.all([
    authority.setResearchFocus({ assetId: "nova" }),
    authority.executeTrade({ assetId: "luma", side: "buy", quantity: 1 })
  ]);

  const research = await authority.getResearch();
  assert.equal(research.stage, "independent-investor");
  assert.equal(research.onboardingComplete, true);
  assert.equal(session.store.state.portfolio.progression.independentInvestorComplete, true);
});

test("currently provable legacy progression reconciles without changing shared market state", async () => {
  const session = createClockedAuthority();
  const authority = session.authority();
  session.store.state.portfolio.positions = {
    nova: { quantity: 1, costBasisCents: 100 },
    luma: { quantity: 1, costBasisCents: 100 }
  };
  session.store.state.portfolio.research = { firstStockPurchaseComplete: true, activeStockAssetId: "nova" };
  delete session.store.state.portfolio.progression;
  const runtimeBefore = structuredClone(session.store.state.runtime);
  const marketBefore = await authority.getMarket();
  const portfolioBefore = await authority.getPortfolio();
  const reconciled = await authority.getResearch();
  assert.equal(reconciled.stage, "independent-investor");
  assert.equal(session.store.state.portfolio.progression.independentInvestorComplete, true);
  assert.deepEqual(session.store.state.runtime, runtimeBefore);
  assert.deepEqual(await authority.getMarket(), marketBefore);
  assert.deepEqual(await authority.getPortfolio(), portfolioBefore);
});

test("unprovable legacy history stays incomplete", async () => {
  const variants = [
    { positions: { nova: { quantity: 1, costBasisCents: 100 } }, research: { firstStockPurchaseComplete: true, activeStockAssetId: "nova" } },
    { positions: { nova: { quantity: 1, costBasisCents: 100 }, pulse: { quantity: 1, costBasisCents: 100 } }, research: { firstStockPurchaseComplete: true, activeStockAssetId: "nova" } },
    { positions: { nova: { quantity: 1, costBasisCents: 100 }, luma: { quantity: 1, costBasisCents: 100 } }, research: { firstStockPurchaseComplete: true, activeStockAssetId: "pulse" } }
  ];
  for (const variant of variants) {
    const session = createClockedAuthority();
    session.store.state.portfolio.positions = variant.positions;
    session.store.state.portfolio.research = variant.research;
    delete session.store.state.portfolio.progression;
    const research = await session.authority().getResearch();
    assert.equal(research.onboardingComplete, false);
    assert.notEqual(research.stage, "independent-investor");
  }
});
