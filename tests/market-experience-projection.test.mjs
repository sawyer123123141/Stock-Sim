import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyExpectationResearch,
  classifyMarketMovement,
  classifyCompanyResearch,
  createSeedMarket,
  toMarketSnapshot
} from "../dist/packages/sim/src/index.js";

test("every stock receives qualitative research while crypto receives none", () => {
  const snapshot = toMarketSnapshot(createSeedMarket(), 1_000);
  const stocks = snapshot.assets.filter((asset) => asset.kind === "stock");
  const crypto = snapshot.assets.filter((asset) => asset.kind === "crypto");

  assert.ok(stocks.every((asset) => asset.research));
  assert.ok(crypto.every((asset) => asset.research === undefined));
  assert.deepEqual(Object.keys(stocks[0].research.company).sort(), [
    "competitivePosition", "financialHealth", "growth", "profitability", "reputation"
  ]);
  assert.deepEqual(Object.keys(stocks[0].research.expectations).sort(), [
    "demand", "execution", "growth", "profitability"
  ]);
});

test("public market experience snapshots keep raw company and movement internals private", () => {
  const market = createSeedMarket();
  market.assets[0] = {
    ...market.assets[0],
    reasons: [{ code: "demand", label: "Demand", direction: "up", weight: 0.002, summary: "Demand is creating buying pressure." }]
  };
  const publicJson = JSON.stringify(toMarketSnapshot(market, 1_000));

  assert.doesNotMatch(publicJson, /fundamentals|pricingState|pricedExpectations|weight|0\.002|companyStrength/);
  assert.match(publicJson, /research/);
  assert.match(publicJson, /strength/);
});

test("research classification is deterministic, broad, and dimension-specific", () => {
  assert.equal(classifyCompanyResearch(-0.36), "challenged");
  assert.equal(classifyCompanyResearch(-0.35), "mixed");
  assert.equal(classifyCompanyResearch(0.2), "solid");
  assert.equal(classifyCompanyResearch(0.55), "strong");
  assert.equal(classifyExpectationResearch(-0.36), "cautious");
  assert.equal(classifyExpectationResearch(-0.35), "balanced");
  assert.equal(classifyExpectationResearch(0.2), "constructive");
  assert.equal(classifyExpectationResearch(0.55), "high");
});

test("changing one hidden fundamental or expectation only changes its matching qualitative research state", () => {
  const base = createSeedMarket();
  const changed = structuredClone(base);
  changed.assets[0].fundamentals.growth = -0.8;
  changed.assets[0].expectations.demand = -0.9;
  const before = toMarketSnapshot(base, 1_000).assets[0].research;
  const after = toMarketSnapshot(changed, 1_000).assets[0].research;

  assert.notEqual(after.company.growth, before.company.growth);
  assert.notEqual(after.expectations.demand, before.expectations.demand);
  assert.deepEqual(
    { ...after.company, growth: before.company.growth },
    before.company
  );
  assert.deepEqual(
    { ...after.expectations, demand: before.expectations.demand },
    before.expectations
  );
});

test("market movement uses calm active elevated semantics without exposing volatility", () => {
  const stock = createSeedMarket().assets.find((asset) => asset.id === "nova");
  assert.ok(stock);
  assert.equal(classifyMarketMovement({ ...stock, baselineVolatility: 0.22 }), "calm");
  assert.equal(classifyMarketMovement({ ...stock, baselineVolatility: 0.5 }), "active");
  assert.equal(classifyMarketMovement({ ...stock, baselineVolatility: 0.82 }), "elevated");
});
