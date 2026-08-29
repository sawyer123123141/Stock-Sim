import test from "node:test";
import assert from "node:assert/strict";
import { createSeedMarket } from "../dist/packages/sim/src/fixtures.js";
import { createMarketEvent } from "../dist/packages/sim/src/eventGenerator.js";
import { createMarketRuntime } from "../dist/apps/server/src/marketRuntime.js";
import { createInitialGameState, createPersistentGameAuthority } from "../dist/apps/server/src/persistentGameAuthority.js";

class LockedMemoryStore {
  constructor(state) { this.state = structuredClone(state); }
  async transact(mutation) { return mutation(this.state); }
}

function stock(runtime, assetId = "nova") {
  const asset = runtime.recoveryState().marketState.assets.find((candidate) => candidate.id === assetId);
  assert.ok(asset?.fundamentals && asset.expectations);
  return asset;
}

function event(overrides = {}) {
  return {
    id: "event-1",
    title: "A meaningful company update",
    summary: "New public information changes the company outlook.",
    effect: 0,
    publishedAt: 5_000,
    reactionStartsAt: 5_000,
    expiresAt: 8_000,
    target: { kind: "asset", value: "nova" },
    outcome: { growth: 0.9, demand: 0.9 },
    expectedOutcome: { growth: 0.5, demand: 0.75 },
    surprise: 0.25,
    significance: "major",
    consequenceVersion: 1,
    fundamentalImpact: { growth: 0.2, reputation: 0.1 },
    ...overrides
  };
}

function runtimeWith(eventState) {
  return createMarketRuntime({
    initialState: { ...createSeedMarket(), activeEvents: [eventState] },
    seed: 17,
    startedAtMs: 0,
    firstEventDelayMs: 60_000
  });
}

test("a published event applies only its persistent fundamental dimensions and updates linked expectations", () => {
  const runtime = runtimeWith(event());
  const before = stock(runtime);

  runtime.advanceTo(5_000);
  const after = stock(runtime);

  assert.ok(after.fundamentals.growth > before.fundamentals.growth);
  assert.ok(after.fundamentals.reputation > before.fundamentals.reputation);
  assert.equal(after.fundamentals.profitability, before.fundamentals.profitability);
  assert.equal(after.fundamentals.financialHealth, before.fundamentals.financialHealth);
  assert.equal(after.fundamentals.competitivePosition, before.fundamentals.competitivePosition);
  assert.ok(after.expectations.growth > before.expectations.growth);
  assert.ok(after.expectations.growth < event().outcome.growth);
  assert.ok(after.expectations.demand > before.expectations.demand);
  assert.ok(after.expectations.demand < event().outcome.demand);
  assert.equal(after.expectations.profitability, before.expectations.profitability);
  assert.equal(after.expectations.execution, before.expectations.execution);
});

test("significance scales a sparse fundamental delta while keeping all fundamentals bounded", () => {
  const minor = runtimeWith(event({ id: "minor", significance: "minor", fundamentalImpact: { growth: 1 } }));
  const major = runtimeWith(event({ id: "major", significance: "major", fundamentalImpact: { growth: 1 } }));
  minor.advanceTo(5_000);
  major.advanceTo(5_000);

  const initialGrowth = stock(runtimeWith(event())).fundamentals.growth;
  assert.ok(stock(minor).fundamentals.growth > initialGrowth);
  assert.ok(stock(major).fundamentals.growth > stock(minor).fundamentals.growth);
  for (const value of Object.values(stock(major).fundamentals)) {
    assert.ok(value >= -1 && value <= 1);
  }
});

test("publication consequences apply once, survive expiry, and retain an explicit recovery marker", () => {
  const runtime = runtimeWith(event());
  runtime.advanceTo(5_000);
  const afterPublication = structuredClone(stock(runtime));
  const recovery = runtime.recoveryState();

  assert.deepEqual(recovery.appliedEventIds, ["event-1"]);
  runtime.advanceTo(10_000);
  assert.deepEqual(stock(runtime).fundamentals, afterPublication.fundamentals);
  assert.deepEqual(stock(runtime).expectations, afterPublication.expectations);

  const recovered = createMarketRuntime({ recoveryState: recovery });
  recovered.advanceTo(10_000);
  assert.deepEqual(stock(recovered).fundamentals, afterPublication.fundamentals);
  assert.deepEqual(stock(recovered).expectations, afterPublication.expectations);
  assert.deepEqual(recovered.recoveryState().appliedEventIds, ["event-1"]);
});

test("off-cycle advances never reapply a published event", () => {
  const runtime = runtimeWith(event());
  runtime.advanceTo(5_000);
  const afterPublication = structuredClone(stock(runtime));

  runtime.advanceTo(5_001);

  assert.deepEqual(stock(runtime).fundamentals, afterPublication.fundamentals);
  assert.deepEqual(stock(runtime).expectations, afterPublication.expectations);
  assert.deepEqual(runtime.recoveryState().appliedEventIds, ["event-1"]);
});

test("a prior public event changes the expectations later event snapshots and its surprise", () => {
  const before = createSeedMarket();
  const initialEvent = createMarketEvent({
    id: "later-before",
    publishedAt: 10_000,
    rng: () => 0,
    assets: before.assets
  });
  const runtime = runtimeWith(event({ outcome: { demand: 1 } }));
  runtime.advanceTo(5_000);
  const after = runtime.recoveryState().marketState;
  const laterEvent = createMarketEvent({
    id: "later-after",
    publishedAt: 10_000,
    rng: () => 0,
    assets: after.assets
  });

  assert.equal(initialEvent.outcome.demand, laterEvent.outcome.demand);
  assert.ok(laterEvent.expectedOutcome.demand > initialEvent.expectedOutcome.demand);
  assert.notEqual(laterEvent.surprise, initialEvent.surprise);
});

test("legacy structured events without a consequence version remain unchanged during recovery", () => {
  const legacy = event();
  delete legacy.consequenceVersion;
  delete legacy.fundamentalImpact;
  const runtime = runtimeWith(legacy);
  const before = stock(runtime);

  runtime.advanceTo(5_000);
  const after = stock(runtime);

  assert.deepEqual(after.fundamentals, before.fundamentals);
  assert.deepEqual(after.expectations, before.expectations);
  assert.deepEqual(runtime.recoveryState().appliedEventIds, []);
});

test("persistent catch-up and restart apply generated consequences on the same canonical timeline", async () => {
  const createSession = () => {
    let nowMs = 0;
    const state = createInitialGameState(0);
    state.runtime.nextEventAtMs = 5_000;
    state.runtime.eventIntervalMs = 10_000;
    const store = new LockedMemoryStore(state);
    return {
      store,
      setNow(value) { nowMs = value; },
      authority: () => createPersistentGameAuthority(store, () => nowMs)
    };
  };
  const continuous = createSession();
  const continuousAuthority = continuous.authority();
  for (const time of [5_000, 10_000, 15_000, 20_000]) {
    continuous.setNow(time);
    await continuousAuthority.getMarket();
  }

  const dormant = createSession();
  dormant.setNow(20_000);
  await dormant.authority().getMarket();

  const restarted = createSession();
  const beforeRestart = restarted.authority();
  restarted.setNow(10_000);
  await beforeRestart.getMarket();
  restarted.setNow(20_000);
  await restarted.authority().getMarket();

  assert.deepEqual(dormant.store.state.runtime, continuous.store.state.runtime);
  assert.deepEqual(restarted.store.state.runtime, continuous.store.state.runtime);
  assert.deepEqual(
    continuous.store.state.runtime.appliedEventIds,
    ["event-1", "event-2"],
    "each generated event is marked exactly once"
  );
});
