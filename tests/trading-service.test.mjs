import test from "node:test";
import assert from "node:assert/strict";
import { createSeedMarket } from "../dist/packages/sim/src/fixtures.js";
import { createMarketRuntime } from "../dist/apps/server/src/marketRuntime.js";
import { InMemoryPortfolioStore } from "../dist/apps/server/src/portfolioStore.js";
import { createTradingService } from "../dist/apps/server/src/tradingService.js";

function setup() {
  let nowMs = 1_000;
  const runtime = createMarketRuntime({
    initialState: createSeedMarket(),
    seed: 123,
    startedAtMs: nowMs
  });
  const store = new InMemoryPortfolioStore();
  const service = createTradingService({ runtime, store, now: () => nowMs });
  const nova = runtime.snapshot().assets.find((asset) => asset.id === "nova");
  assert.ok(nova);
  return {
    runtime,
    service,
    store,
    nova,
    setNow(value) {
      nowMs = value;
    }
  };
}

test("fresh demo portfolio starts with exactly $10,000 and no positions", async () => {
  const { service } = setup();
  const portfolio = await service.getPortfolio("demo-player");

  assert.equal(portfolio.cash, 10_000);
  assert.equal(portfolio.marketValue, 0);
  assert.equal(portfolio.totalValue, 10_000);
  assert.deepEqual(portfolio.positions, []);
});

test("whole-unit buys use the authoritative price and aggregate cost basis", async () => {
  const { service, nova } = setup();

  const first = await service.executeTrade("demo-player", {
    assetId: nova.id,
    side: "buy",
    quantity: 10
  });
  assert.equal(first.fill.unitPrice, 42.18);
  assert.equal(first.fill.total, 421.8);
  assert.equal(first.portfolio.cash, 9_578.2);
  assert.equal(first.portfolio.positions[0].quantity, 10);
  assert.equal(first.portfolio.positions[0].averageCost, 42.18);

  const second = await service.executeTrade("demo-player", {
    assetId: nova.id,
    side: "buy",
    quantity: 5
  });
  assert.equal(second.portfolio.cash, 9_367.3);
  assert.equal(second.portfolio.positions[0].quantity, 15);
  assert.equal(second.portfolio.positions[0].averageCost, 42.18);
});

test("partial and final sells return cash and remove an empty position", async () => {
  const { service, nova } = setup();

  await service.executeTrade("demo-player", { assetId: nova.id, side: "buy", quantity: 10 });
  const partial = await service.executeTrade("demo-player", { assetId: nova.id, side: "sell", quantity: 4 });

  assert.equal(partial.portfolio.cash, 9_746.92);
  assert.equal(partial.portfolio.positions[0].quantity, 6);
  assert.equal(partial.portfolio.positions[0].averageCost, 42.18);

  const final = await service.executeTrade("demo-player", { assetId: nova.id, side: "sell", quantity: 6 });
  assert.equal(final.portfolio.cash, 10_000);
  assert.deepEqual(final.portfolio.positions, []);
});

test("invalid quantities are rejected without changing portfolio state", async () => {
  const { service, nova } = setup();
  const before = await service.getPortfolio("demo-player");

  for (const quantity of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    await assert.rejects(
      () => service.executeTrade("demo-player", { assetId: nova.id, side: "buy", quantity }),
      (error) => error?.code === "INVALID_TRADE"
    );
  }

  assert.deepEqual(await service.getPortfolio("demo-player"), before);
});

test("insufficient cash and overselling reject without mutating state", async () => {
  const { service, nova } = setup();
  const fresh = await service.getPortfolio("demo-player");

  await assert.rejects(
    () => service.executeTrade("demo-player", { assetId: nova.id, side: "buy", quantity: 1_000 }),
    (error) => error?.code === "INSUFFICIENT_CASH"
  );
  assert.deepEqual(await service.getPortfolio("demo-player"), fresh);

  await service.executeTrade("demo-player", { assetId: nova.id, side: "buy", quantity: 2 });
  const owned = await service.getPortfolio("demo-player");
  await assert.rejects(
    () => service.executeTrade("demo-player", { assetId: nova.id, side: "sell", quantity: 3 }),
    (error) => error?.code === "INSUFFICIENT_HOLDINGS"
  );
  assert.deepEqual(await service.getPortfolio("demo-player"), owned);
});

test("unknown assets reject without changing state", async () => {
  const { service } = setup();
  const before = await service.getPortfolio("demo-player");

  await assert.rejects(
    () => service.executeTrade("demo-player", { assetId: "missing", side: "buy", quantity: 1 }),
    (error) => error?.code === "ASSET_NOT_FOUND"
  );

  assert.deepEqual(await service.getPortfolio("demo-player"), before);
});

test("an invalid execution clock cannot commit a trade before failing", async () => {
  const { runtime, nova } = setup();
  const store = new InMemoryPortfolioStore();
  const service = createTradingService({ runtime, store, now: () => Number.NaN });
  const before = await service.getPortfolio("demo-player");

  await assert.rejects(
    () => service.executeTrade("demo-player", { assetId: nova.id, side: "buy", quantity: 1 }),
    (error) => error?.code === "INVALID_TRADE"
  );

  assert.deepEqual(await service.getPortfolio("demo-player"), before);
});

test("portfolio valuation follows the current authoritative market price", async () => {
  const { service, runtime, nova, setNow } = setup();
  const bought = await service.executeTrade("demo-player", { assetId: nova.id, side: "buy", quantity: 10 });
  const beforeValue = bought.portfolio.positions[0].marketValue;

  setNow(61_000);
  runtime.advanceTo(61_000);
  const after = await service.getPortfolio("demo-player");

  assert.equal(after.positions[0].currentPrice, runtime.snapshot().assets.find((asset) => asset.id === nova.id).price);
  assert.notEqual(after.positions[0].marketValue, beforeValue);
  assert.equal(after.totalValue, Math.round((after.cash + after.marketValue) * 100) / 100);
});

test("concurrent portfolio transactions serialize instead of overwriting each other", async () => {
  const { store } = setup();

  await Promise.all([
    store.transact("demo-player", (portfolio) => {
      portfolio.cashCents -= 100;
    }),
    store.transact("demo-player", (portfolio) => {
      portfolio.cashCents -= 200;
    })
  ]);

  const portfolio = await store.read("demo-player");
  assert.equal(portfolio.cashCents, 999_700);
});
