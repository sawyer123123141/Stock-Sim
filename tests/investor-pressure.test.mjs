import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateSimulatedInvestorPressure,
  createSeedMarket,
  createSeededRng,
  tickMarket
} from "../dist/packages/sim/src/index.js";

function novaWith(signals) {
  const nova = createSeedMarket().assets.find((asset) => asset.id === "nova");
  assert.ok(nova);
  return { ...nova, ...signals };
}

test("simulated investors react positively, negatively, and neutrally to market conditions", () => {
  const positive = calculateSimulatedInvestorPressure(novaWith({
    companyStrength: 0.9,
    sectorTrend: 0.7,
    sentiment: 0.6,
    momentum: 0.4
  }), 0.5);
  const negative = calculateSimulatedInvestorPressure(novaWith({
    companyStrength: 0,
    sectorTrend: -0.7,
    sentiment: -0.6,
    momentum: -0.4
  }), -0.5);
  const neutral = calculateSimulatedInvestorPressure(novaWith({
    companyStrength: 0.25,
    sectorTrend: 0,
    sentiment: 0,
    momentum: 0
  }), 0);

  assert.ok(positive > 0.15);
  assert.ok(negative < -0.15);
  assert.ok(Math.abs(neutral) < 0.05);
});

test("simulated investor pressure and momentum response stay bounded", () => {
  const extreme = novaWith({
    companyStrength: 999,
    sectorTrend: 999,
    sentiment: 999,
    momentum: 999
  });
  const cappedMomentum = novaWith({ momentum: 1 });
  const impossibleMomentum = novaWith({ momentum: 999 });

  assert.ok(Math.abs(calculateSimulatedInvestorPressure(extreme, 999)) <= 0.65);
  assert.equal(
    calculateSimulatedInvestorPressure(cappedMomentum, 0),
    calculateSimulatedInvestorPressure(impossibleMomentum, 0)
  );
});

test("crypto speculative activity follows a distinct pressure response from stocks", () => {
  const signals = { sectorTrend: 0.7, sentiment: 0.6, momentum: 0.4 };
  const stock = novaWith({ ...signals, companyStrength: undefined });
  const crypto = { ...stock, id: "test-crypto", symbol: "TEST", kind: "crypto" };

  assert.notEqual(
    calculateSimulatedInvestorPressure(stock, 0.5),
    calculateSimulatedInvestorPressure(crypto, 0.5)
  );
});

test("the same seeded market state and time produce the same simulated pressure and price path", () => {
  const state = createSeedMarket();
  const pressureByAsset = Object.fromEntries(state.assets.map((asset) => [
    asset.id,
    { simulated: calculateSimulatedInvestorPressure(asset, 0), player: 0 }
  ]));
  const replayPressureByAsset = Object.fromEntries(state.assets.map((asset) => [
    asset.id,
    { simulated: calculateSimulatedInvestorPressure(asset, 0), player: 0 }
  ]));

  assert.deepEqual(pressureByAsset, replayPressureByAsset);
  assert.deepEqual(
    tickMarket(state, 60_000, 60_000, pressureByAsset, createSeededRng(42)),
    tickMarket(state, 60_000, 60_000, replayPressureByAsset, createSeededRng(42))
  );
});
