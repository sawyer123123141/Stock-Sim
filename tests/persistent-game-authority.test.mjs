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
