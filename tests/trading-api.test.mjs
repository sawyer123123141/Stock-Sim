import test from "node:test";
import assert from "node:assert/strict";
import { createSeedMarket } from "../dist/packages/sim/src/fixtures.js";
import { createMarketRuntime } from "../dist/apps/server/src/marketRuntime.js";
import { createMarketServer } from "../dist/apps/server/src/server.js";

function setupServer() {
  const runtime = createMarketRuntime({
    initialState: createSeedMarket(),
    seed: 444,
    startedAtMs: 1_000
  });
  const server = createMarketServer({ runtime });
  const nova = runtime.snapshot().assets.find((asset) => asset.id === "nova");
  assert.ok(nova);
  return { server, runtime, nova };
}

test("GET /api/portfolio returns the server-owned demo portfolio", async () => {
  const { server } = setupServer();
  try {
    const response = await server.app.inject({ method: "GET", url: "/api/portfolio" });
    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), {
      cash: 10_000,
      marketValue: 0,
      totalValue: 10_000,
      positions: []
    });
  } finally {
    await server.close();
  }
});

test("POST /api/trades executes at the authoritative price and returns updated portfolio", async () => {
  const { server, nova } = setupServer();
  try {
    const response = await server.app.inject({
      method: "POST",
      url: "/api/trades",
      payload: { assetId: nova.id, side: "buy", quantity: 2 }
    });

    assert.equal(response.statusCode, 200);
    const body = response.json();
    assert.equal(body.fill.assetId, nova.id);
    assert.equal(body.fill.unitPrice, 42.18);
    assert.equal(body.fill.quantity, 2);
    assert.equal(body.portfolio.cash, 9_915.64);
    assert.equal(body.portfolio.positions[0].quantity, 2);

    const portfolio = await server.app.inject({ method: "GET", url: "/api/portfolio" });
    assert.deepEqual(portfolio.json(), body.portfolio);
  } finally {
    await server.close();
  }
});

test("trade API maps expected failures to stable 4xx responses without mutation", async () => {
  const { server, nova } = setupServer();
  try {
    const cases = [
      {
        payload: { assetId: nova.id, side: "buy", quantity: 1.5 },
        status: 400,
        code: "INVALID_TRADE"
      },
      {
        payload: { assetId: "missing", side: "buy", quantity: 1 },
        status: 404,
        code: "ASSET_NOT_FOUND"
      },
      {
        payload: { assetId: nova.id, side: "buy", quantity: 1_000 },
        status: 409,
        code: "INSUFFICIENT_CASH"
      },
      {
        payload: { assetId: nova.id, side: "sell", quantity: 1 },
        status: 409,
        code: "INSUFFICIENT_HOLDINGS"
      }
    ];

    for (const entry of cases) {
      const response = await server.app.inject({
        method: "POST",
        url: "/api/trades",
        payload: entry.payload
      });
      assert.equal(response.statusCode, entry.status);
      assert.equal(response.json().error, entry.code);
    }

    const portfolio = await server.app.inject({ method: "GET", url: "/api/portfolio" });
    assert.deepEqual(portfolio.json(), {
      cash: 10_000,
      marketValue: 0,
      totalValue: 10_000,
      positions: []
    });
  } finally {
    await server.close();
  }
});
