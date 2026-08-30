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

test("GET /api/stories/:assetId returns only that asset's public archived history", async () => {
  const seed = createSeedMarket();
  const runtime = createMarketRuntime({
    initialState: {
      ...seed,
      storyHistory: [{
        id: "luma-archive",
        title: "LUMA scaling update",
        target: { kind: "asset", value: "luma" },
        updates: [{
          id: "luma-archive:scaling",
          title: "Commercial scaling details emerge",
          summary: "The battery outlook changes.",
          publishedAt: -1_800_001,
          relatedAssetIds: ["nova"]
        }]
      }]
    },
    startedAtMs: 0
  });
  const app = buildMarketApp({ runtime });

  const response = await app.inject({ method: "GET", url: "/api/stories/nova" });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { stories: [{
    id: "luma-archive",
    title: "LUMA scaling update",
    target: { kind: "asset", value: "luma" },
    status: "resolved",
    lifecycle: "archive",
    updates: [{
      id: "luma-archive:scaling",
      title: "Commercial scaling details emerge",
      summary: "The battery outlook changes.",
      publishedAt: "1969-12-31T23:29:59.999Z",
      relatedAssetIds: ["nova"]
    }]
  }] });

  await app.close();
});

test("GET /api/stories/:assetId bounds chart context to the requested public time range", async () => {
  const seed = createSeedMarket();
  const runtime = createMarketRuntime({
    initialState: {
      ...seed,
      storyHistory: [{
        id: "nova-chart-history",
        title: "NOVA public history",
        target: { kind: "asset", value: "nova" },
        updates: [{ id: "inside", title: "Inside", summary: "Visible public update.", publishedAt: 5_000 }, {
          id: "outside", title: "Outside", summary: "Outside the chart range.", publishedAt: 15_000
        }]
      }]
    },
    startedAtMs: 1_900_000
  });
  const app = buildMarketApp({ runtime });
  const response = await app.inject({ method: "GET", url: "/api/stories/nova?from=4000&to=6000" });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json().stories[0]?.updates.map((update) => update.id), ["inside"]);
  await app.close();
});
