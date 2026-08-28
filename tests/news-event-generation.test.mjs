import test from "node:test";
import assert from "node:assert/strict";
import { createSeededRng } from "../dist/packages/sim/src/rng.js";
import { createMarketEvent } from "../dist/packages/sim/src/eventGenerator.js";
import { createSeedMarket } from "../dist/packages/sim/src/fixtures.js";
import { createMarketRuntime } from "../dist/apps/server/src/marketRuntime.js";

test("event generation replays the same curated event for the same seed and publication time", () => {
  const first = createMarketEvent({
    id: "event-1",
    publishedAt: 120_000,
    rng: createSeededRng(90210)
  });
  const replay = createMarketEvent({
    id: "event-1",
    publishedAt: 120_000,
    rng: createSeededRng(90210)
  });

  assert.deepEqual(first, replay);
  assert.ok(first.reactionStartsAt > first.publishedAt);
  assert.ok(first.expiresAt > first.reactionStartsAt);
  assert.ok(first.effect >= -1 && first.effect <= 1);
});

test("the authoritative runtime schedules the same public event timeline for the same seed", () => {
  const makeRuntime = () => createMarketRuntime({
    initialState: createSeedMarket(),
    seed: 90210,
    startedAtMs: 0,
    firstEventDelayMs: 1_000,
    eventIntervalMs: 5_000
  });
  const first = makeRuntime();
  const replay = makeRuntime();

  const firstSnapshot = first.advanceTo(1_000);
  const replaySnapshot = replay.advanceTo(1_000);

  assert.equal(firstSnapshot.events.length, 1);
  assert.deepEqual(firstSnapshot.events, replaySnapshot.events);
  assert.equal(firstSnapshot.events[0].publishedAt, "1970-01-01T00:00:01.000Z");
});
