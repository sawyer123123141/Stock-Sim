import test from "node:test";
import assert from "node:assert/strict";
import { createSeedMarket } from "../dist/packages/sim/src/fixtures.js";
import { createMarketRuntime } from "../dist/apps/server/src/marketRuntime.js";
import { buildMarketApp } from "../dist/apps/server/src/app.js";

test("GET /api/market returns the authoritative market snapshot", async () => {
  const runtime = createMarketRuntime({
    initialState: createSeedMarket(),
    seed: 123,
    startedAtMs: 1_000
  });
  runtime.advanceTo(6_000);

  const app = buildMarketApp({ runtime });
  const response = await app.inject({ method: "GET", url: "/api/market" });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), runtime.snapshot());

  await app.close();
});
