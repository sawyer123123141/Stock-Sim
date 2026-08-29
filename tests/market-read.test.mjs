import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyMarketPressure,
  classifyMarketRisk,
  createSeedMarket
} from "../dist/packages/sim/src/index.js";
import { createMarketRuntime } from "../dist/apps/server/src/marketRuntime.js";

function assetWith(overrides) {
  const nova = createSeedMarket().assets.find((asset) => asset.id === "nova");
  assert.ok(nova);
  return { ...nova, ...overrides };
}

test("market risk classification is deterministic and follows baseline volatility", () => {
  const calmerStock = assetWith({ baselineVolatility: 0.22, kind: "stock" });
  const moreVolatileAsset = assetWith({ baselineVolatility: 0.82, kind: "crypto" });

  assert.equal(classifyMarketRisk(calmerStock), "low");
  assert.equal(classifyMarketRisk(calmerStock), "low");
  assert.equal(classifyMarketRisk(moreVolatileAsset), "high");
});

test("normal seed crypto does not appear low risk", () => {
  const crypto = createSeedMarket().assets.filter((asset) => asset.kind === "crypto");

  assert.ok(crypto.length > 0);
  assert.ok(crypto.every((asset) => classifyMarketRisk(asset) !== "low"));
});

test("market pressure language stays coarse across neutral, slight, and strong signals", () => {
  assert.equal(classifyMarketPressure(0), "balanced");
  assert.equal(classifyMarketPressure(0.12), "slightly-up");
  assert.equal(classifyMarketPressure(-0.12), "slightly-down");
  assert.equal(classifyMarketPressure(0.5), "up");
  assert.equal(classifyMarketPressure(-0.5), "down");
});

test("the server snapshot derives qualitative market reads from combined pressure without leaking raw drivers", () => {
  const neutralMarket = createSeedMarket();
  neutralMarket.assets = neutralMarket.assets.map((asset) => ({
    ...asset,
    companyStrength: 0.25,
    sectorTrend: 0,
    sentiment: 0,
    momentum: 0
  }));
  const runtime = createMarketRuntime({
    initialState: neutralMarket,
    seed: 5,
    startedAtMs: 1_000
  });

  const beforeTrade = runtime.snapshot().assets.find((asset) => asset.id === "nova");
  assert.ok(beforeTrade);
  assert.deepEqual(beforeTrade.marketRead, { risk: "low", pressure: "balanced" });

  for (let index = 0; index < 100; index += 1) {
    runtime.recordPlayerTrade("nova", "buy", 10_000, 1_000);
  }
  const afterTrade = runtime.snapshot().assets.find((asset) => asset.id === "nova");
  assert.ok(afterTrade);
  assert.equal(afterTrade.marketRead.pressure, "slightly-up");
  assert.deepEqual(Object.keys(afterTrade.marketRead).sort(), ["pressure", "risk"]);
  assert.equal("simulated" in afterTrade.marketRead, false);
  assert.equal("player" in afterTrade.marketRead, false);
  assert.equal("eventEffect" in afterTrade.marketRead, false);
});

test("a strong simulated lean stays directional despite bounded player pressure", () => {
  const market = createSeedMarket();
  market.assets = market.assets.map((asset) => asset.id === "nova"
    ? {
      ...asset,
      sectorTrend: -1,
      sentiment: -1,
      momentum: -1,
      expectations: { growth: -0.5, profitability: -0.5, demand: -0.5, execution: -0.5 },
      pricingState: {
        pricedExpectations: { growth: 0.5, profitability: 0.5, demand: 0.5, execution: 0.5 }
      }
    }
    : asset);
  const runtime = createMarketRuntime({ initialState: market, seed: 6, startedAtMs: 1_000 });

  runtime.recordPlayerTrade("nova", "buy", 10_000, 1_000);
  const nova = runtime.snapshot().assets.find((asset) => asset.id === "nova");

  assert.ok(nova);
  assert.equal(nova.marketRead.pressure, "down");
});

test("the same canonical market state produces the same public market read", () => {
  const options = {
    initialState: createSeedMarket(),
    seed: 17,
    startedAtMs: 1_000
  };
  const first = createMarketRuntime(options);
  const second = createMarketRuntime(options);

  assert.deepEqual(
    first.advanceTo(6_000).assets.map((asset) => asset.marketRead),
    second.advanceTo(6_000).assets.map((asset) => asset.marketRead)
  );
});
