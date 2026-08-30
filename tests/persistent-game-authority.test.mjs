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

test("asset-scoped history returns only relevant public archive outside the live market snapshot", async () => {
  const session = createClockedAuthority();
  session.store.state.runtime.marketState.storyHistory = [{
    id: "luma-archive",
    title: "LUMA scaling update",
    target: { kind: "asset", value: "luma" },
    updates: [{
      id: "luma-archive:scaling",
      title: "Commercial scaling details emerge",
      summary: "The public update changes the battery supply outlook.",
      publishedAt: -1_800_001,
      relatedAssetIds: ["nova"]
    }]
  }, {
    id: "hgrid-archive",
    title: "Harvest Grid contract update",
    target: { kind: "asset", value: "hgrid" },
    updates: [{
      id: "hgrid-archive:contract",
      title: "Grid contract expands",
      summary: "The public update is unrelated to NOVA.",
      publishedAt: -1_800_001
    }]
  }];

  const market = await session.authority.getMarket();
  const history = await session.authority.getStoryHistory("nova");

  assert.equal(market.stories.some((story) => story.id === "luma-archive"), false);
  assert.deepEqual(history, { stories: [{
    id: "luma-archive",
    title: "LUMA scaling update",
    target: { kind: "asset", value: "luma" },
    status: "resolved",
    lifecycle: "archive",
    updates: [{
      id: "luma-archive:scaling",
      title: "Commercial scaling details emerge",
      summary: "The public update changes the battery supply outlook.",
      publishedAt: "1969-12-31T23:29:59.999Z",
      relatedAssetIds: ["nova"]
    }]
  }] });
  assert.doesNotMatch(JSON.stringify(history), /outcome|expectation|effect|reaction|fundamental|RNG/i);
});

test("asset-scoped history returns only public archived updates inside a requested chart range", async () => {
  const session = createClockedAuthority();
  session.store.state.runtime.marketState.storyHistory = [{
    id: "luma-chart-context",
    title: "LUMA battery update",
    target: { kind: "asset", value: "luma" },
    updates: [{
      id: "luma-chart-context:inside",
      title: "Published battery progress",
      summary: "Public battery information affects NOVA's outlook.",
      publishedAt: 5_000,
      relatedAssetIds: ["nova"]
    }, {
      id: "luma-chart-context:outside",
      title: "Later battery update",
      summary: "This public update falls outside the visible chart window.",
      publishedAt: 15_000,
      relatedAssetIds: ["nova"]
    }]
  }, {
    id: "hgrid-chart-context",
    title: "Unrelated grid update",
    target: { kind: "asset", value: "hgrid" },
    updates: [{
      id: "hgrid-chart-context:inside",
      title: "Grid context",
      summary: "This is unrelated to NOVA.",
      publishedAt: 5_000
    }]
  }];

  session.setNow(1_900_000);
  const market = await session.authority.getMarket();
  const context = await session.authority.getStoryHistory("nova", { fromMs: 4_000, toMs: 6_000 });

  assert.equal(market.stories.some((story) => story.id === "luma-chart-context"), false);
  assert.deepEqual(context, { stories: [{
    id: "luma-chart-context",
    title: "LUMA battery update",
    target: { kind: "asset", value: "luma" },
    status: "resolved",
    lifecycle: "archive",
    updates: [{
      id: "luma-chart-context:inside",
      title: "Published battery progress",
      summary: "Public battery information affects NOVA's outlook.",
      publishedAt: "1970-01-01T00:00:05.000Z",
      relatedAssetIds: ["nova"]
    }]
  }] });
  assert.doesNotMatch(JSON.stringify(context), /outside|outcome|expectation|effect|reaction|RNG/i);
});

test("asset-scoped history uses stable bounded pages without replaying live stories", async () => {
  const session = createClockedAuthority();
  session.store.state.runtime.marketState.storyHistory = Array.from({ length: 51 }, (_, index) => ({
    id: `nova-archive-${index}`,
    title: `NOVA archive ${index}`,
    target: { kind: "asset", value: "nova" },
    updates: [{
      id: `nova-archive-${index}:public`,
      title: `Public NOVA information ${index}`,
      summary: "Public historical context.",
      publishedAt: -1_800_001 - index
    }]
  }));

  const range = { fromMs: -1_900_000, toMs: -1_700_000 };
  const first = await session.authority.getStoryHistory("nova", range);
  const second = await session.authority.getStoryHistory("nova", { ...range, cursor: first.nextCursor });

  assert.equal(first.stories.length, 50);
  assert.equal(first.stories[0].id, "nova-archive-0");
  assert.equal(first.nextCursor, "nova-archive-49");
  assert.deepEqual(second, {
    stories: [expectArchiveStory(50)]
  });
});

function expectArchiveStory(index) {
  return {
    id: `nova-archive-${index}`,
    title: `NOVA archive ${index}`,
    target: { kind: "asset", value: "nova" },
    status: "resolved",
    lifecycle: "archive",
    updates: [{
      id: `nova-archive-${index}:public`,
      title: `Public NOVA information ${index}`,
      summary: "Public historical context.",
      publishedAt: new Date(-1_800_001 - index).toISOString()
    }]
  };
}

test("continuous, restarted, and dormant canonical catch-up reach the same story partition", async () => {
  function session() {
    const clocked = createClockedAuthority();
    clocked.store.state.runtime.marketState.stories = [{
      id: "story-partition",
      title: "LUMA supply update",
      target: { kind: "asset", value: "luma" },
      status: "developing",
      updates: [{
        id: "story-partition:public",
        title: "Supply update becomes public",
        summary: "The battery supply outlook changes.",
        publishedAt: 5_000,
        state: "pending",
        outcome: { execution: 0.8 },
        significance: "major"
      }]
    }];
    clocked.store.state.runtime.nextEventAtMs = 1_000_000;
    return clocked;
  }

  const continuous = session();
  continuous.setNow(5_000);
  await continuous.authority.getMarket();
  continuous.setNow(200_000);
  await continuous.authority.getMarket();

  const restarted = session();
  restarted.setNow(5_000);
  await restarted.authority.getMarket();
  restarted.setNow(200_000);
  await createPersistentGameAuthority(restarted.store, () => 200_000).getMarket();

  const dormant = session();
  dormant.setNow(200_000);
  await dormant.authority.getMarket();

  assert.deepEqual(restarted.store.state.runtime, continuous.store.state.runtime);
  assert.deepEqual(dormant.store.state.runtime, continuous.store.state.runtime);
  assert.equal(continuous.store.state.runtime.marketState.stories.length, 0);
  assert.equal(continuous.store.state.runtime.marketState.storyHistory.length, 1);
});
