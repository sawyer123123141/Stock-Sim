import test from "node:test";
import assert from "node:assert/strict";
import { createSeedMarket } from "../dist/packages/sim/src/fixtures.js";
import { createMarketRuntime } from "../dist/apps/server/src/marketRuntime.js";
import { createMarketServer } from "../dist/apps/server/src/server.js";

test("market server starts and stops the authoritative runtime with its listener", async () => {
  let scheduledIntervalMs;
  let cancelled = false;

  const runtime = createMarketRuntime({
    initialState: createSeedMarket(),
    seed: 42,
    startedAtMs: 1_000,
    tickIntervalMs: 5_000,
    scheduler: {
      every(intervalMs) {
        scheduledIntervalMs = intervalMs;
        return () => {
          cancelled = true;
        };
      }
    }
  });

  const server = createMarketServer({ runtime });
  await server.listen({ host: "127.0.0.1", port: 0 });

  assert.equal(scheduledIntervalMs, 5_000);

  await server.close();
  assert.equal(cancelled, true);
});
