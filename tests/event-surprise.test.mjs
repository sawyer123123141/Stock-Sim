import test from "node:test";
import assert from "node:assert/strict";
import * as eventGenerator from "../dist/packages/sim/src/eventGenerator.js";
import { createSeedMarket } from "../dist/packages/sim/src/fixtures.js";
import { createMarketRuntime } from "../dist/apps/server/src/marketRuntime.js";
import { toMarketSnapshot } from "../dist/packages/sim/src/market.js";

const OUTCOME_DIMENSIONS = [
  "growth",
  "profitability",
  "demand",
  "execution",
  "financialHealth",
  "competitivePosition",
  "reputation"
];

function assertBoundedOutcome(outcome) {
  for (const [dimension, value] of Object.entries(outcome)) {
    assert.ok(OUTCOME_DIMENSIONS.includes(dimension));
    assert.equal(Number.isFinite(value), true);
    assert.ok(value >= -1 && value <= 1);
  }
}

test("stock events record sparse business outcomes, expected outcomes, surprise, and significance", () => {
  const market = createSeedMarket();
  const event = eventGenerator.createMarketEvent({
    id: "event-1",
    publishedAt: 10_000,
    rng: () => 0,
    assets: market.assets
  });

  assert.ok(event.outcome, "stock event has an explicit business outcome");
  assert.ok(event.expectedOutcome, "stock event snapshots relevant expectations");
  assert.ok(["minor", "normal", "major", "transformative"].includes(event.significance));
  assertBoundedOutcome(event.outcome);
  assertBoundedOutcome(event.expectedOutcome);
  assert.ok(event.surprise >= -1 && event.surprise <= 1);
  assert.equal(event.outcome.demand > 0, true, "the commuter launch is objectively strong demand");
  assert.ok(event.surprise > 0);
  assert.ok(event.effect > 0, "compatibility effect follows surprise");
});

test("every current stock catalog event receives deterministic structured meaning", () => {
  const market = createSeedMarket();
  for (const index of Array.from({ length: 8 }, (_, value) => value)) {
    const event = eventGenerator.createMarketEvent({
      id: `stock-${index}`,
      publishedAt: 10_000,
      rng: () => (index + 0.1) / 10,
      assets: market.assets
    });
    assert.ok(event.outcome, `${event.id} has an outcome`);
    assert.ok(event.expectedOutcome, `${event.id} snapshots expectations`);
    assert.ok(event.significance, `${event.id} has significance`);
    assertBoundedOutcome(event.outcome);
    assert.ok(event.surprise >= -1 && event.surprise <= 1);
  }
});

test("surprise compares outcomes against expectations independently of whether a result sounds good", () => {
  assert.equal(typeof eventGenerator.calculateStockEventSurprise, "function");

  const positiveButDisappointing = eventGenerator.calculateStockEventSurprise(
    { demand: 0.5 },
    { demand: 0.8 }
  );
  const negativeButBetterThanFeared = eventGenerator.calculateStockEventSurprise(
    { execution: -0.2 },
    { execution: -0.7 }
  );
  const meetsExpectation = eventGenerator.calculateStockEventSurprise(
    { growth: 0.35, profitability: -0.1 },
    { growth: 0.35, profitability: -0.1 }
  );

  assert.ok(positiveButDisappointing < 0);
  assert.ok(negativeButBetterThanFeared > 0);
  assert.equal(meetsExpectation, 0);
});

test("compatibility effects keep meaningful significance separation across surprise magnitudes", () => {
  assert.equal(typeof eventGenerator.effectFromStockEventSurprise, "function");

  const tiers = ["minor", "normal", "major", "transformative"];
  const effectsFor = (surprise) => tiers.map((significance) =>
    eventGenerator.effectFromStockEventSurprise(surprise, significance)
  );
  const assertOrderedTiers = (effects, minimumGap = 0) => {
    for (let index = 1; index < effects.length; index += 1) {
      assert.ok(effects[index] > effects[index - 1]);
      assert.ok(effects[index] - effects[index - 1] >= minimumGap);
    }
  };

  assert.equal(eventGenerator.effectFromStockEventSurprise(0, "transformative"), 0);

  const small = effectsFor(0.02);
  const moderate = effectsFor(0.2);
  const large = effectsFor(0.6);
  assert.ok(small[3] < 0.15, "a small surprise remains a small influence signal");
  assertOrderedTiers(small, 0.01);
  assertOrderedTiers(moderate, 0.05);
  assertOrderedTiers(large, 0.05);

  const negativeLarge = effectsFor(-0.6);
  for (let index = 0; index < large.length; index += 1) {
    assert.equal(negativeLarge[index], -large[index]);
  }
  for (const surprise of [-10, -0.6, -0.2, -0.02, 0, 0.02, 0.2, 0.6, 10]) {
    for (const effect of effectsFor(surprise)) {
      assert.ok(Math.abs(effect) <= 0.75);
    }
  }
});

test("the commuter launch retains a meaningful but bounded game-pacing effect", () => {
  const event = eventGenerator.createMarketEvent({
    id: "nova-demand",
    publishedAt: 10_000,
    rng: () => 0,
    assets: createSeedMarket().assets
  });

  assert.ok(event.effect > 0.25);
  assert.ok(event.effect < 0.75);
});

test("crypto events retain the legacy numeric-only event path", () => {
  const event = eventGenerator.createMarketEvent({
    id: "crypto-event",
    publishedAt: 10_000,
    rng: () => 0.81,
    assets: createSeedMarket().assets
  });

  assert.equal(event.target.value, "Crypto");
  assert.equal(event.outcome, undefined);
  assert.equal(event.expectedOutcome, undefined);
  assert.equal(event.surprise, undefined);
  assert.equal(event.significance, undefined);
  assert.ok(event.effect > 0);
});

test("structured active events survive recovery while legacy numeric events stay untouched", () => {
  const market = createSeedMarket();
  const structured = eventGenerator.createMarketEvent({
    id: "event-1",
    publishedAt: 5_000,
    rng: () => 0,
    assets: market.assets
  });
  assert.ok(structured.outcome);
  const runtime = createMarketRuntime({
    initialState: { ...market, activeEvents: [structured] },
    seed: 22,
    startedAtMs: 5_000
  });
  const recovery = runtime.recoveryState();
  const recovered = createMarketRuntime({ recoveryState: recovery });
  assert.deepEqual(recovered.recoveryState(), recovery);

  const {
    outcome,
    expectedOutcome,
    surprise,
    significance,
    fundamentalImpact,
    consequenceVersion,
    ...legacyBase
  } = structured;
  const legacy = {
    ...legacyBase,
    id: "legacy-event",
    effect: -0.44
  };
  const legacyRecovered = createMarketRuntime({
    recoveryState: { ...recovery, marketState: { ...recovery.marketState, activeEvents: [legacy] } }
  }).recoveryState();
  assert.deepEqual(legacyRecovered.marketState.activeEvents, [legacy]);
  assert.equal("outcome" in legacyRecovered.marketState.activeEvents[0], false);
  assert.equal(legacyRecovered.rngState, recovery.rngState);
  assert.equal(legacyRecovered.lastAdvancedAtMs, recovery.lastAdvancedAtMs);
  assert.equal(legacyRecovered.nextEventAtMs, recovery.nextEventAtMs);
});

test("public market snapshots keep stock event business truth private", () => {
  const market = createSeedMarket();
  const event = eventGenerator.createMarketEvent({
    id: "event-1",
    publishedAt: 5_000,
    rng: () => 0,
    assets: market.assets
  });
  const publicEvent = toMarketSnapshot({ ...market, activeEvents: [event] }, 50_000).events[0];
  assert.ok(publicEvent);
  for (const field of [
    "effect",
    "outcome",
    "expectedOutcome",
    "surprise",
    "significance",
    "fundamentalImpact",
    "consequenceVersion"
  ]) {
    assert.equal(field in publicEvent, false, `${field} remains server-only`);
  }
});
