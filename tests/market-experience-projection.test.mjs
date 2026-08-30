import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyExpectationResearch,
  classifyMarketMovement,
  classifyCompanyResearch,
  createSeedMarket,
  toFocusedStockResearchBrief,
  toMarketSnapshot
} from "../dist/packages/sim/src/index.js";

test("shared MarketSnapshot omits qualitative research while a focused stock brief keeps broad labels", () => {
  const market = createSeedMarket();
  const snapshot = toMarketSnapshot(market, 1_000);
  const nova = market.assets.find((asset) => asset.id === "nova");
  const pulse = market.assets.find((asset) => asset.id === "pulse");
  assert.ok(nova);
  assert.ok(pulse);
  const brief = toFocusedStockResearchBrief(nova, market.assets);

  assert.ok(snapshot.assets.every((asset) => !("research" in asset)));
  assert.ok(brief);
  assert.equal(toFocusedStockResearchBrief(pulse, market.assets), undefined);
  assert.deepEqual(Object.keys(brief.company).sort(), [
    "competitivePosition", "financialHealth", "growth", "profitability", "reputation"
  ]);
  assert.deepEqual(Object.keys(brief.expectations).sort(), [
    "demand", "execution", "growth", "profitability"
  ]);
  assert.doesNotMatch(JSON.stringify(brief), /fundamentals|pricingState|pricedExpectations|weight|effect|RNG/i);
});

test("public market experience snapshots keep raw company and movement internals private", () => {
  const market = createSeedMarket();
  market.assets[0] = {
    ...market.assets[0],
    reasons: [{ code: "demand", label: "Demand", direction: "up", weight: 0.002, summary: "Demand is creating buying pressure." }]
  };
  const publicJson = JSON.stringify(toMarketSnapshot(market, 1_000));

  assert.doesNotMatch(publicJson, /fundamentals|pricingState|pricedExpectations|weight|0\.002|companyStrength|research/);
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
  const before = toFocusedStockResearchBrief(base.assets[0], base.assets);
  const after = toFocusedStockResearchBrief(changed.assets[0], changed.assets);

  assert.ok(before);
  assert.ok(after);

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

test("market movement uses current activity semantics without exposing raw drivers", () => {
  const stock = createSeedMarket().assets.find((asset) => asset.id === "nova");
  assert.ok(stock);
  assert.equal(classifyMarketMovement({ ...stock, baselineVolatility: 0.82, lastTickChangePct: 0, momentum: 0 }), "calm");
  assert.equal(classifyMarketMovement({ ...stock, baselineVolatility: 0.22, lastTickChangePct: 0.2, momentum: 0.08 }), "active");
  assert.equal(classifyMarketMovement({ ...stock, baselineVolatility: 0.22, lastTickChangePct: 0.42, momentum: 0.3 }), "elevated");

  const publicAsset = toMarketSnapshot({ ...createSeedMarket(), assets: [{ ...stock, lastTickChangePct: 0.42, momentum: 0.3 }] }, 1_000).assets[0];
  assert.deepEqual(Object.keys(publicAsset.marketRead).sort(), ["movement", "pressure"]);
  assert.equal(JSON.stringify(publicAsset.marketRead).includes("momentum"), false);
  assert.equal(JSON.stringify(publicAsset.marketRead).includes("0.42"), false);
});
