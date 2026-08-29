import test from "node:test";
import assert from "node:assert/strict";
import * as sim from "../dist/packages/sim/src/index.js";
import { createMarketRuntime } from "../dist/apps/server/src/marketRuntime.js";
import { createInitialGameState, createPersistentGameAuthority } from "../dist/apps/server/src/persistentGameAuthority.js";
import { createSeededRng } from "../dist/packages/sim/src/rng.js";
import { tickAsset } from "../dist/packages/sim/src/tick.js";

function stock(id = "nova") {
  const asset = sim.createSeedMarket().assets.find((candidate) => candidate.id === id);
  assert.ok(asset && asset.kind === "stock");
  return asset;
}

test("seeded stocks start with current expectations already priced while crypto has no pricing state", () => {
  const market = sim.createSeedMarket();

  for (const asset of market.assets) {
    if (asset.kind === "stock") {
      assert.deepEqual(asset.pricingState?.pricedExpectations, asset.expectations);
    } else {
      assert.equal(asset.pricingState, undefined);
    }
  }
});

test("legacy hydration copies current expectations into priced expectations without an artificial gap", () => {
  const original = createMarketRuntime({ initialState: sim.createSeedMarket(), seed: 42, startedAtMs: 0 });
  original.advanceTo(5_000);
  const legacy = structuredClone(original.recoveryState());
  legacy.marketState.assets = legacy.marketState.assets.map(({ pricingState, ...asset }) => asset);

  const hydrated = createMarketRuntime({ recoveryState: legacy }).recoveryState();
  for (const asset of hydrated.marketState.assets.filter((candidate) => candidate.kind === "stock")) {
    assert.deepEqual(asset.pricingState?.pricedExpectations, asset.expectations);
  }
  assert.equal(hydrated.rngState, legacy.rngState);
  assert.equal(hydrated.lastAdvancedAtMs, legacy.lastAdvancedAtMs);
  assert.equal(hydrated.marketState.sequence, legacy.marketState.sequence);
});

test("investor interpretation gives an unpriced expectation increase positive repricing pressure", () => {
  assert.equal(typeof sim.calculateStockInvestorInterpretation, "function");
  const asset = {
    ...stock(),
    expectations: { growth: 0.8, profitability: 0.4, demand: 0.8, execution: 0.5 },
    pricingState: {
      pricedExpectations: { growth: 0.5, profitability: 0.2, demand: 0.75, execution: 0.4 }
    },
    momentum: 0,
    sentiment: 0,
    sectorTrend: 0
  };

  const interpretation = sim.calculateStockInvestorInterpretation(asset, 0);
  assert.ok(interpretation.repricingPressure > 0);
  assert.ok(interpretation.aggregate > 0);
});

test("priced expectations absorb toward current expectations after investors use the pre-absorption gap", () => {
  const asset = {
    ...stock(),
    expectations: { growth: 0.8, profitability: 0.2, demand: 0.75, execution: 0.4 },
    pricingState: {
      pricedExpectations: { growth: 0.5, profitability: 0.2, demand: 0.75, execution: 0.4 }
    },
    momentum: 0,
    sentiment: 0,
    sectorTrend: 0,
    baselineVolatility: 0
  };

  const result = tickAsset(
    asset,
    { demand: { simulated: 0, player: 0 }, eventEffect: 0, deltaMs: 60_000 },
    createSeededRng(7)
  );

  assert.ok(result.asset.pricingState.pricedExpectations.growth > 0.5);
  assert.ok(result.asset.pricingState.pricedExpectations.growth < 0.8);
});

test("hidden fundamentals and legacy company strength do not affect stock investor interpretation", () => {
  const base = {
    ...stock(),
    expectations: { growth: 0.7, profitability: 0.35, demand: 0.8, execution: 0.5 },
    pricingState: {
      pricedExpectations: { growth: 0.55, profitability: 0.15, demand: 0.7, execution: 0.4 }
    },
    momentum: -0.1,
    sentiment: 0.05,
    sectorTrend: 0.1
  };
  const differentTruth = {
    ...base,
    companyStrength: -1,
    fundamentals: { growth: -1, profitability: -1, financialHealth: -1, competitivePosition: -1, reputation: -1 }
  };

  assert.equal(
    sim.calculateSimulatedInvestorPressure(base, 0.1),
    sim.calculateSimulatedInvestorPressure(differentTruth, 0.1)
  );
});

test("direct stock ticks no longer price legacy company strength", () => {
  const base = { ...stock(), baselineVolatility: 0, momentum: 0, sentiment: 0, sectorTrend: 0 };
  const stronger = { ...base, companyStrength: 1 };
  const weaker = { ...base, companyStrength: -1 };
  const context = { demand: { simulated: 0, player: 0 }, eventEffect: 0, deltaMs: 60_000 };

  assert.equal(
    tickAsset(stronger, context, createSeededRng(11)).returnFraction,
    tickAsset(weaker, context, createSeededRng(11)).returnFraction
  );
});

test("repricing is directional, zero without a gap, and fades as beliefs become priced", () => {
  const base = { ...stock(), momentum: 0, sentiment: 0, sectorTrend: 0 };
  const positive = {
    ...base,
    expectations: { growth: 0.8, profitability: 0.2, demand: 0.75, execution: 0.4 },
    pricingState: { pricedExpectations: { growth: 0.5, profitability: 0.2, demand: 0.75, execution: 0.4 } }
  };
  const negative = {
    ...base,
    expectations: { growth: 0.2, profitability: 0.2, demand: 0.75, execution: 0.4 },
    pricingState: { pricedExpectations: { growth: 0.6, profitability: 0.2, demand: 0.75, execution: 0.4 } }
  };
  const neutral = {
    ...base,
    expectations: { growth: 0.5, profitability: 0.2, demand: 0.75, execution: 0.4 },
    pricingState: { pricedExpectations: { growth: 0.5, profitability: 0.2, demand: 0.75, execution: 0.4 } }
  };

  assert.ok(sim.calculateStockInvestorInterpretation(positive, 0).repricingPressure > 0);
  assert.ok(sim.calculateStockInvestorInterpretation(negative, 0).repricingPressure < 0);
  assert.equal(sim.calculateStockInvestorInterpretation(neutral, 0).repricingPressure, 0);

  let absorbing = positive;
  const initialPressure = sim.calculateStockInvestorInterpretation(absorbing, 0).repricingPressure;
  for (let tick = 0; tick < 24; tick += 1) {
    absorbing = tickAsset(
      absorbing,
      { demand: { simulated: 0, player: 0 }, eventEffect: 0, deltaMs: 5_000 },
      createSeededRng(tick + 100)
    ).asset;
  }
  const laterPressure = sim.calculateStockInvestorInterpretation(absorbing, 0).repricingPressure;
  assert.ok(laterPressure > 0);
  assert.ok(laterPressure < initialPressure * 0.6);
});

test("persistent repricing remains after temporary event reaction and investor groups can disagree", () => {
  const asset = {
    ...stock(),
    expectations: { growth: 0.85, profitability: 0.45, demand: 0.8, execution: 0.65 },
    pricingState: { pricedExpectations: { growth: 0.5, profitability: 0.2, demand: 0.7, execution: 0.4 } },
    momentum: -1,
    sentiment: -0.4,
    sectorTrend: 0
  };

  const afterEventExpiry = sim.calculateStockInvestorInterpretation(asset, 0);
  assert.ok(afterEventExpiry.repricingPressure > 0, "the expectation gap survives after direct news is gone");
  assert.ok(afterEventExpiry.value > 0);
  assert.ok(afterEventExpiry.cautious > 0);
  assert.ok(afterEventExpiry.momentum < 0);
  assert.ok(afterEventExpiry.aggregate < afterEventExpiry.value + afterEventExpiry.cautious);
});

test("pricing-state absorption round-trips through deterministic restart recovery", () => {
  const initialState = sim.createSeedMarket();
  const nova = initialState.assets.find((asset) => asset.id === "nova");
  assert.ok(nova?.expectations && nova.pricingState);
  nova.expectations = { ...nova.expectations, growth: 0.8 };

  const continuous = createMarketRuntime({ initialState: structuredClone(initialState), seed: 73, startedAtMs: 0 });
  continuous.advanceTo(5_000);
  continuous.advanceTo(10_000);

  const restarted = createMarketRuntime({ initialState: structuredClone(initialState), seed: 73, startedAtMs: 0 });
  restarted.advanceTo(5_000);
  const recovered = createMarketRuntime({ recoveryState: restarted.recoveryState() });
  recovered.advanceTo(10_000);

  assert.deepEqual(recovered.recoveryState(), continuous.recoveryState());
});

test("public snapshots keep pricing state and private expectation gaps hidden", () => {
  const snapshot = sim.toMarketSnapshot(sim.createSeedMarket(), 0);
  for (const asset of snapshot.assets) {
    assert.equal("pricingState" in asset, false);
    assert.equal("expectations" in asset, false);
    assert.equal("repricingPressure" in asset, false);
  }
});

test("event expiry removes temporary effect while its unpriced public information keeps repricing pressure", () => {
  const event = {
    id: "event-1",
    title: "Public information",
    summary: "A report changes current beliefs.",
    effect: 0.5,
    publishedAt: 5_000,
    reactionStartsAt: 5_000,
    expiresAt: 10_000,
    target: { kind: "asset", value: "nova" },
    outcome: { growth: 1 },
    expectedOutcome: { growth: 0.5 },
    surprise: 0.25,
    significance: "major",
    consequenceVersion: 1
  };
  const runtime = createMarketRuntime({
    initialState: { ...sim.createSeedMarket(), activeEvents: [event] },
    seed: 31,
    startedAtMs: 0,
    firstEventDelayMs: 60_000
  });

  runtime.advanceTo(5_000);
  runtime.advanceTo(10_000);
  const afterExpiry = runtime.recoveryState().marketState.assets.find((asset) => asset.id === "nova");
  assert.ok(afterExpiry);

  assert.equal(sim.combinedEventEffect(runtime.recoveryState().marketState.activeEvents, afterExpiry, 10_000), 0);
  assert.ok(sim.calculateStockInvestorInterpretation(afterExpiry, 0).repricingPressure > 0);
  assert.notEqual(afterExpiry.pricingState.pricedExpectations.growth, afterExpiry.expectations.growth);
});

test("persistent canonical catch-up preserves repricing absorption exactly across restart", async () => {
  class LockedMemoryStore {
    constructor(state) { this.state = structuredClone(state); }
    async transact(mutation) { return mutation(this.state); }
  }
  const createSession = () => {
    let nowMs = 0;
    const state = createInitialGameState(0);
    const nova = state.runtime.marketState.assets.find((asset) => asset.id === "nova");
    assert.ok(nova?.expectations);
    nova.expectations = { ...nova.expectations, growth: 0.8 };
    const store = new LockedMemoryStore(state);
    return {
      store,
      setNow(value) { nowMs = value; },
      authority: () => createPersistentGameAuthority(store, () => nowMs)
    };
  };

  const continuous = createSession();
  const uninterrupted = continuous.authority();
  for (const time of [5_000, 10_000, 15_000]) {
    continuous.setNow(time);
    await uninterrupted.getMarket();
  }

  const restarted = createSession();
  restarted.setNow(5_000);
  await restarted.authority().getMarket();
  restarted.setNow(15_000);
  await restarted.authority().getMarket();

  assert.deepEqual(restarted.store.state.runtime, continuous.store.state.runtime);
});
