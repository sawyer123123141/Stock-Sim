import test from "node:test";
import assert from "node:assert/strict";
import { createInitialGameState, createPersistentGameAuthority } from "../dist/apps/server/src/persistentGameAuthority.js";

class LockedMemoryStore {
  constructor(state) { this.state = structuredClone(state); this.queue = Promise.resolve(); }
  async transact(mutation) {
    const previous = this.queue;
    let release;
    this.queue = new Promise((resolve) => { release = resolve; });
    await previous;
    try { return await mutation(this.state); } finally { release(); }
  }
}

function createClockedAuthority(startedAtMs = 0) {
  let nowMs = startedAtMs;
  const store = new LockedMemoryStore(createInitialGameState(startedAtMs));
  const authority = createPersistentGameAuthority(store, () => nowMs);
  return {
    authority,
    store,
    setNow(value) {
      nowMs = value;
    }
  };
}

async function readAtTimes(times) {
  const session = createClockedAuthority();
  for (const time of times) {
    session.setNow(time);
    await session.authority.getMarket();
  }
  return session.store.state.runtime;
}

test("persistent authority serializes market catch-up and portfolio mutations", async () => {
  let nowMs = 0;
  const store = new LockedMemoryStore(createInitialGameState(nowMs));
  const first = createPersistentGameAuthority(store, () => nowMs);
  const second = createPersistentGameAuthority(store, () => nowMs);

  nowMs = 15_000;
  const [a, b] = await Promise.all([first.getMarket(), second.getMarket()]);
  assert.equal(a.generatedAt, b.generatedAt);
  assert.equal(a.sequence, 3, "catch-up uses three ordinary five-second ticks");

  const expensive = a.assets.find((asset) => asset.id === "nova");
  assert.ok(expensive);
  const quantity = Math.floor(10_000 / expensive.price);
  const results = await Promise.allSettled([
    first.executeTrade({ assetId: "nova", side: "buy", quantity }),
    second.executeTrade({ assetId: "nova", side: "buy", quantity })
  ]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal((await first.getPortfolio()).positions[0]?.quantity, quantity);
});

test("off-cycle market reads cannot change the canonical market path", async () => {
  const oneRead = await readAtTimes([180_000]);
  const manyReads = await readAtTimes([1_001, 3_999, 5_001, 7_400, 45_001, 89_999, 120_600, 165_001, 179_999, 180_000]);

  assert.deepEqual(manyReads, oneRead);
  assert.equal(manyReads.rngState, oneRead.rngState);
  assert.deepEqual(manyReads.marketState.assets, oneRead.marketState.assets);
  assert.deepEqual(manyReads.marketState.activeEvents, oneRead.marketState.activeEvents);
  assert.ok(oneRead.marketState.activeEvents.length > 0);
});

test("shifted polling sessions produce the same canonical recovery state", async () => {
  const firstPattern = await readAtTimes([4_500, 5_000, 7_400, 10_000, 14_999, 15_000, 20_000]);
  const secondPattern = await readAtTimes([1_000, 4_999, 5_001, 9_999, 10_001, 14_500, 19_999, 20_000]);

  assert.deepEqual(secondPattern, firstPattern);
});

test("a read before the next canonical tick does not consume RNG or advance sequence", async () => {
  const session = createClockedAuthority();
  const before = structuredClone(session.store.state.runtime);

  session.setNow(4_999);
  const snapshot = await session.authority.getMarket();

  assert.equal(snapshot.sequence, 0);
  assert.equal(session.store.state.runtime.rngState, before.rngState);
  assert.equal(session.store.state.runtime.lastAdvancedAtMs, before.lastAdvancedAtMs);
});

test("an exact canonical tick boundary advances exactly once", async () => {
  const session = createClockedAuthority();

  session.setNow(5_000);
  const first = await session.authority.getMarket();
  const afterFirst = structuredClone(session.store.state.runtime);
  const second = await session.authority.getMarket();

  assert.equal(first.sequence, 1);
  assert.equal(second.sequence, 1);
  assert.deepEqual(session.store.state.runtime, afterFirst);
});

test("an off-cycle trade uses the latest canonical price and retains real-time pressure timing", async () => {
  const session = createClockedAuthority();
  const initialNova = session.store.state.runtime.marketState.assets.find((asset) => asset.id === "nova");
  assert.ok(initialNova);

  session.setNow(1_000);
  const trade = await session.authority.executeTrade({ assetId: "nova", side: "buy", quantity: 1 });

  assert.equal(trade.fill.unitPrice, initialNova.price);
  assert.equal(session.store.state.runtime.marketState.sequence, 0);
  assert.equal(session.store.state.runtime.playerPressure.nova?.[0]?.recordedAtMs, 1_000);

  session.setNow(5_000);
  await session.authority.getMarket();
  assert.equal(session.store.state.runtime.marketState.sequence, 1);
});

test("catch-up uses the persisted canonical tick interval", async () => {
  const session = createClockedAuthority();
  session.store.state.runtime.tickIntervalMs = 2_000;

  session.setNow(4_000);
  const snapshot = await session.authority.getMarket();

  assert.equal(snapshot.sequence, 2);
  assert.equal(session.store.state.runtime.lastAdvancedAtMs, 4_000);
});

test("recovery after a restart catches up on the same canonical timeline", async () => {
  const uninterrupted = await readAtTimes([5_000, 10_000, 20_000]);
  const session = createClockedAuthority();

  for (const time of [5_000, 9_999]) {
    session.setNow(time);
    await session.authority.getMarket();
  }
  const restarted = createPersistentGameAuthority(session.store, () => 20_000);
  await restarted.getMarket();

  assert.deepEqual(session.store.state.runtime, uninterrupted);
});
