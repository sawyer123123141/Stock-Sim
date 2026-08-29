import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateSimulatedInvestorPressure,
  combinedEventEffect,
  createMarketEvent,
  createSeedMarket,
  createSeededRng,
  tickMarket
} from "../dist/packages/sim/src/index.js";

const SEEDS = Array.from({ length: 64 }, (_, index) => index + 1);
const TICK_MS = 5_000;

function percentile(values, proportion) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.round((sorted.length - 1) * proportion)];
}

function simulate(seed, assetId, horizonMs, event = null) {
  let state = createSeedMarket();
  if (event) state = { ...state, activeEvents: [event] };

  const start = state.assets.find((asset) => asset.id === assetId);
  assert.ok(start, `missing ${assetId}`);
  const rng = createSeededRng(seed);
  let low = start.price;
  let high = start.price;
  let clampTicks = 0;
  let maxMomentum = Math.abs(start.momentum);

  for (let nowMs = TICK_MS; nowMs <= horizonMs; nowMs += TICK_MS) {
    const pressureByAsset = Object.fromEntries(state.assets.map((asset) => [
      asset.id,
      {
        simulated: calculateSimulatedInvestorPressure(
          asset,
          combinedEventEffect(state.activeEvents, asset, nowMs)
        ),
        player: 0
      }
    ]));
    state = tickMarket(state, nowMs, TICK_MS, pressureByAsset, rng);
    const current = state.assets.find((asset) => asset.id === assetId);
    assert.ok(current, `missing ${assetId} after tick`);
    low = Math.min(low, current.price);
    high = Math.max(high, current.price);
    maxMomentum = Math.max(maxMomentum, Math.abs(current.momentum));
    const tickClampPct = current.kind === "stock" ? 1 : 3;
    if (Math.abs(current.lastTickChangePct) >= tickClampPct - 0.00001) clampTicks += 1;
  }

  const end = state.assets.find((asset) => asset.id === assetId);
  assert.ok(end, `missing ${assetId} at end`);
  const signedPct = (end.price / start.price - 1) * 100;
  return {
    signedPct,
    absolutePct: Math.abs(signedPct),
    rangePct: (high / low - 1) * 100,
    clampTicks,
    maxMomentum,
    finalPrice: end.price
  };
}

function distribution(assetId, horizonMs, event = null) {
  return SEEDS.map((seed) => simulate(seed, assetId, horizonMs, event));
}

test("quiet stocks have a game-speed hour of movement without unsafe extremes", () => {
  const oneMinute = distribution("nova", 60 * 1_000).map((result) => result.absolutePct);
  const tenMinutes = distribution("nova", 10 * 60 * 1_000).map((result) => result.absolutePct);
  const results = distribution("nova", 60 * 60 * 1_000);
  const absoluteMoves = results.map((result) => result.absolutePct);

  assert.ok(percentile(oneMinute, 0.5) >= 0.05, "quiet NOVA should visibly update over a minute");
  assert.ok(percentile(tenMinutes, 0.5) >= 0.2, "quiet NOVA should become noticeable over ten minutes");
  assert.ok(percentile(absoluteMoves, 0.5) >= 0.75, "quiet NOVA should usually move enough to matter over an hour");
  assert.ok(percentile(absoluteMoves, 0.9) <= 4, "quiet NOVA should not routinely become extreme");
  assert.ok(results.every((result) => result.finalPrice > 0 && Number.isFinite(result.finalPrice)));
  assert.ok(results.every((result) => result.maxMomentum <= 1));
  assert.ok(results.every((result) => result.clampTicks === 0));
});

test("a targeted existing event creates a meaningfully stronger 10-minute move than quiet conditions", () => {
  const event = createMarketEvent({ id: "event-1", publishedAt: 0, rng: () => 0.01, assets: createSeedMarket().assets });
  const quiet = distribution("nova", 10 * 60 * 1_000);
  const withEvent = distribution("nova", 10 * 60 * 1_000, event);
  const eventAdvantage = withEvent.map((result, index) => result.signedPct - quiet[index].signedPct);

  assert.ok(percentile(eventAdvantage, 0.5) >= 0.4, "existing NOVA demand news should visibly exceed quiet movement");
});

test("existing positive and negative events retain opposing price direction", () => {
  const positiveEvent = createMarketEvent({ id: "positive-event", publishedAt: 0, rng: () => 0.01, assets: createSeedMarket().assets });
  const negativeEvent = createMarketEvent({ id: "negative-event", publishedAt: 0, rng: () => 0.11, assets: createSeedMarket().assets });
  const quiet = distribution("nova", 10 * 60 * 1_000);
  const positive = distribution("nova", 10 * 60 * 1_000, positiveEvent);
  const negative = distribution("nova", 10 * 60 * 1_000, negativeEvent);
  const positiveAdvantage = positive.map((result, index) => result.signedPct - quiet[index].signedPct);
  const negativeAdvantage = negative.map((result, index) => result.signedPct - quiet[index].signedPct);

  assert.ok(percentile(positiveAdvantage, 0.5) >= 0.4);
  assert.ok(percentile(negativeAdvantage, 0.5) <= -0.3);
});

test("crypto remains more volatile than stocks across the same deterministic hour", () => {
  const stockMoves = distribution("luma", 60 * 60 * 1_000).map((result) => result.absolutePct);
  const cryptoMoves = distribution("pulse", 60 * 60 * 1_000).map((result) => result.absolutePct);

  assert.ok(percentile(cryptoMoves, 0.5) > percentile(stockMoves, 0.5) * 1.5);
});

test("market-pace measurements replay exactly for the same seed and event path", () => {
  const event = createMarketEvent({ id: "event-1", publishedAt: 0, rng: () => 0.01, assets: createSeedMarket().assets });

  assert.deepEqual(
    simulate(42, "nova", 10 * 60 * 1_000, event),
    simulate(42, "nova", 10 * 60 * 1_000, event)
  );
});
