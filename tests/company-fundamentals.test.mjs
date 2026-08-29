import test from "node:test";
import assert from "node:assert/strict";
import { createSeedMarket } from "../dist/packages/sim/src/fixtures.js";
import { createMarketRuntime } from "../dist/apps/server/src/marketRuntime.js";
import { createInitialGameState, createPersistentGameAuthority } from "../dist/apps/server/src/persistentGameAuthority.js";

const STOCK_DIMENSIONS = [
  "growth",
  "profitability",
  "financialHealth",
  "competitivePosition",
  "reputation"
];
const EXPECTATION_DIMENSIONS = ["growth", "profitability", "demand", "execution"];

function assertNormalized(values, dimensions) {
  for (const dimension of dimensions) {
    assert.equal(Number.isFinite(values[dimension]), true, `${dimension} is finite`);
    assert.ok(values[dimension] >= -1 && values[dimension] <= 1, `${dimension} is bounded`);
  }
}

function withoutCompanyReality(marketState) {
  return {
    ...marketState,
    assets: marketState.assets.map(({ fundamentals, expectations, ...asset }) => asset)
  };
}

class LockedMemoryStore {
  constructor(state) {
    this.state = structuredClone(state);
  }

  async transact(mutation) {
    return mutation(this.state);
  }
}

test("seeded stocks have distinct normalized fundamentals and market expectations", () => {
  const market = createSeedMarket();
  const stocks = market.assets.filter((asset) => asset.kind === "stock");

  assert.equal(stocks.length, 3);
  for (const stock of stocks) {
    assert.ok(stock.fundamentals, `${stock.symbol} has fundamentals`);
    assert.ok(stock.expectations, `${stock.symbol} has expectations`);
    assertNormalized(stock.fundamentals, STOCK_DIMENSIONS);
    assertNormalized(stock.expectations, EXPECTATION_DIMENSIONS);
  }

  const nova = stocks.find((asset) => asset.id === "nova");
  const luma = stocks.find((asset) => asset.id === "luma");
  const hgrid = stocks.find((asset) => asset.id === "hgrid");
  assert.ok(nova && luma && hgrid);
  assert.notDeepEqual(nova.fundamentals, luma.fundamentals);
  assert.notDeepEqual(nova.fundamentals, hgrid.fundamentals);
  assert.notDeepEqual(luma.expectations, hgrid.expectations);

  for (const crypto of market.assets.filter((asset) => asset.kind === "crypto")) {
    assert.equal(crypto.fundamentals, undefined);
    assert.equal(crypto.expectations, undefined);
  }
});

test("legacy recovery hydrates only missing stock company reality without changing runtime state", () => {
  const original = createMarketRuntime({
    initialState: createSeedMarket(),
    seed: 91,
    startedAtMs: 0,
    firstEventDelayMs: 5_000,
    eventIntervalMs: 10_000
  });
  original.advanceTo(5_000);
  original.recordPlayerTrade("nova", "buy", 3, 5_000);
  const legacy = structuredClone(original.recoveryState());
  legacy.marketState = withoutCompanyReality(legacy.marketState);

  const recovered = createMarketRuntime({ recoveryState: legacy });
  const hydrated = recovered.recoveryState();

  for (const stock of hydrated.marketState.assets.filter((asset) => asset.kind === "stock")) {
    assert.ok(stock.fundamentals, `${stock.symbol} has hydrated fundamentals`);
    assert.ok(stock.expectations, `${stock.symbol} has hydrated expectations`);
    assertNormalized(stock.fundamentals, STOCK_DIMENSIONS);
    assertNormalized(stock.expectations, EXPECTATION_DIMENSIONS);
  }
  assert.deepEqual(withoutCompanyReality(hydrated.marketState), legacy.marketState);
  assert.equal(hydrated.rngState, legacy.rngState);
  assert.equal(hydrated.lastAdvancedAtMs, legacy.lastAdvancedAtMs);
  assert.equal(hydrated.nextEventAtMs, legacy.nextEventAtMs);
  assert.equal(hydrated.eventCount, legacy.eventCount);
  assert.deepEqual(hydrated.playerPressure, legacy.playerPressure);
  assert.deepEqual(
    createMarketRuntime({ recoveryState: legacy }).recoveryState(),
    hydrated,
    "the same legacy state hydrates deterministically"
  );
});

test("malformed recovered company reality is clamped to safe stock profiles", () => {
  const recovery = createMarketRuntime({ initialState: createSeedMarket(), seed: 22, startedAtMs: 0 })
    .recoveryState();
  const nova = recovery.marketState.assets.find((asset) => asset.id === "nova");
  assert.ok(nova);
  nova.fundamentals = {
    growth: Infinity,
    profitability: -9,
    financialHealth: Number.NaN,
    competitivePosition: 9,
    reputation: 0.4
  };
  nova.expectations = { growth: Number.NaN, profitability: -9, demand: 9, execution: Infinity };

  const hydrated = createMarketRuntime({ recoveryState: recovery }).recoveryState();
  const normalizedNova = hydrated.marketState.assets.find((asset) => asset.id === "nova");
  assert.ok(normalizedNova?.fundamentals && normalizedNova.expectations);
  assertNormalized(normalizedNova.fundamentals, STOCK_DIMENSIONS);
  assertNormalized(normalizedNova.expectations, EXPECTATION_DIMENSIONS);
});

test("the next persistent authority write retains hydrated legacy company reality", async () => {
  const legacy = createInitialGameState(0);
  legacy.runtime.marketState = withoutCompanyReality(legacy.runtime.marketState);
  const store = new LockedMemoryStore(legacy);
  const authority = createPersistentGameAuthority(store, () => 0);

  const snapshot = await authority.getMarket();

  for (const stock of store.state.runtime.marketState.assets.filter((asset) => asset.kind === "stock")) {
    assert.ok(stock.fundamentals, `${stock.symbol} fundamentals persist`);
    assert.ok(stock.expectations, `${stock.symbol} expectations persist`);
  }
  for (const asset of snapshot.assets) {
    assert.equal("fundamentals" in asset, false);
    assert.equal("expectations" in asset, false);
  }
});

test("company reality stays private and does not change deterministic price paths", () => {
  const modern = createMarketRuntime({ initialState: createSeedMarket(), seed: 101, startedAtMs: 0 })
    .recoveryState();
  const legacy = structuredClone(modern);
  legacy.marketState = withoutCompanyReality(legacy.marketState);
  const withProfiles = createMarketRuntime({ recoveryState: modern });
  const hydratedLegacy = createMarketRuntime({ recoveryState: legacy });

  assert.deepEqual(withProfiles.advanceTo(15_000), hydratedLegacy.advanceTo(15_000));
  for (const asset of hydratedLegacy.snapshot().assets) {
    assert.equal("fundamentals" in asset, false);
    assert.equal("expectations" in asset, false);
  }
});
