import test from "node:test";
import assert from "node:assert/strict";
import { createSeedMarket } from "../dist/packages/sim/src/fixtures.js";
import { createMarketRuntime } from "../dist/apps/server/src/marketRuntime.js";
import { createMarketServer } from "../dist/apps/server/src/server.js";

function setupServer() {
  const runtime = createMarketRuntime({
    initialState: createSeedMarket(),
    seed: 789,
    startedAtMs: 1_000
  });
  return createMarketServer({ runtime });
}

test("research routes expose only the focused player brief and stable validation responses", async () => {
  const server = setupServer();
  try {
    const initial = await server.app.inject({ method: "GET", url: "/api/research" });
    assert.equal(initial.statusCode, 200);
    assert.deepEqual(initial.json(), {
      unlocked: false,
      coverageCapacity: 1,
      objective: "make-first-stock-investment"
    });

    const locked = await server.app.inject({
      method: "POST",
      url: "/api/research/focus",
      payload: { assetId: "nova" }
    });
    assert.equal(locked.statusCode, 409);
    assert.equal(locked.json().error, "RESEARCH_LOCKED");

    const buy = await server.app.inject({
      method: "POST",
      url: "/api/trades",
      payload: { assetId: "nova", side: "buy", quantity: 1 }
    });
    assert.equal(buy.statusCode, 200);

    const focused = await server.app.inject({
      method: "POST",
      url: "/api/research/focus",
      payload: { assetId: "hgrid" }
    });
    assert.equal(focused.statusCode, 200);
    assert.equal(focused.json().brief.assetId, "hgrid");

    const privateJson = focused.payload;
    assert.equal(privateJson.includes('"assetId":"nova"'), false);
    assert.doesNotMatch(privateJson, /fundamentals|pricedExpectations|outcome|surprise|effect|weight|rng|runtime|recommend|forecast/i);

    const crypto = await server.app.inject({
      method: "POST",
      url: "/api/research/focus",
      payload: { assetId: "pulse" }
    });
    assert.equal(crypto.statusCode, 400);
    assert.equal(crypto.json().error, "RESEARCH_STOCK_REQUIRED");

    const unknown = await server.app.inject({
      method: "POST",
      url: "/api/research/focus",
      payload: { assetId: "missing" }
    });
    assert.equal(unknown.statusCode, 404);
    assert.equal(unknown.json().error, "RESEARCH_ASSET_NOT_FOUND");

    const current = await server.app.inject({ method: "GET", url: "/api/research" });
    assert.equal(current.json().activeStockAssetId, "hgrid");
  } finally {
    await server.close();
  }
});
