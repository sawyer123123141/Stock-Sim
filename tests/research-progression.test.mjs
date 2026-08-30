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

  assert.deepEqual(await authority.getResearch(), {
    unlocked: false,
    coverageCapacity: 1,
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
  assert.equal(restarted.objective, "broaden-investing");
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
