import test from "node:test";
import assert from "node:assert/strict";
import { createSeedMarket, tickAsset } from "../dist/packages/sim/src/index.js";
import { createMarketRuntime } from "../dist/apps/server/src/marketRuntime.js";
import { createTradingService } from "../dist/apps/server/src/tradingService.js";
import { InMemoryPortfolioStore } from "../dist/apps/server/src/portfolioStore.js";
import { createPlayerPressureBook } from "../dist/apps/server/src/playerPressure.js";

function setup() {
  let nowMs = 1_000;
  const runtime = createMarketRuntime({
    initialState: createSeedMarket(),
    seed: 123,
    startedAtMs: nowMs
  });
  return {
    runtime,
    service: createTradingService({ runtime, store: new InMemoryPortfolioStore(), now: () => nowMs }),
    setNow(value) {
      nowMs = value;
    }
  };
}

test("player buy and sell fills create bounded, decaying pressure in opposite directions", () => {
  const book = createPlayerPressureBook();
  book.recordTrade("nova", "buy", 1, 0);
  const buyPressure = book.pressureForAsset("nova", 0);
  book.recordTrade("luma", "sell", 1, 0);
  const sellPressure = book.pressureForAsset("luma", 0);

  assert.ok(buyPressure > 0);
  assert.ok(sellPressure < 0);
  assert.ok(Math.abs(buyPressure) < 0.25);
  assert.ok(Math.abs(book.pressureForAsset("nova", 120_000)) < Math.abs(buyPressure));

  for (let index = 0; index < 100; index += 1) {
    book.recordTrade("nova", "buy", 10_000, 0);
  }
  assert.ok(book.pressureForAsset("nova", 0) <= 0.5);
});

test("only successful authoritative fills affect server-owned player pressure", async () => {
  const { runtime, service, setNow } = setup();

  await assert.rejects(
    () => service.executeTrade("demo-player", { assetId: "nova", side: "buy", quantity: 1_000 }),
    (error) => error?.code === "INSUFFICIENT_CASH"
  );
  assert.equal(runtime.playerPressureForAsset("nova", 1_000), 0);

  await service.executeTrade("demo-player", { assetId: "nova", side: "buy", quantity: 2 });
  assert.ok(runtime.playerPressureForAsset("nova", 1_000) > 0);

  setNow(2_000);
  await service.executeTrade("demo-player", { assetId: "nova", side: "sell", quantity: 2 });
  assert.ok(runtime.playerPressureForAsset("nova", 2_000) < 0);
});

test("a normal player trade remains smaller than the simulated market component", async () => {
  const { runtime, service } = setup();
  await service.executeTrade("demo-player", { assetId: "nova", side: "buy", quantity: 1 });

  assert.ok(Math.abs(runtime.playerPressureForAsset("nova", 1_000)) < 0.25);
  assert.ok(Math.abs(runtime.simulatedPressureForAsset("nova", 1_000)) > runtime.playerPressureForAsset("nova", 1_000));
});

test("Why It Moved shows demand only when market pressure is meaningful", () => {
  const asset = {
    ...createSeedMarket().assets[0],
    companyStrength: 0.25,
    sectorTrend: 0,
    sentiment: 0,
    momentum: 0,
    baselineVolatility: 0
  };
  const rng = () => 0.5;
  const active = tickAsset(asset, {
    demand: { simulated: 0.6, player: 0 },
    eventEffect: 0,
    deltaMs: 60_000
  }, rng).asset;
  const quiet = tickAsset(asset, {
    demand: { simulated: 0, player: 0 },
    eventEffect: 0,
    deltaMs: 60_000
  }, rng).asset;

  assert.ok(active.reasons.some((reason) => reason.code === "demand"));
  assert.ok(!quiet.reasons.some((reason) => reason.code === "demand"));
});
