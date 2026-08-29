import test from "node:test";
import assert from "node:assert/strict";
import {
  createMarketStory,
  createSeedMarket
} from "../dist/packages/sim/src/index.js";
import { createMarketRuntime } from "../dist/apps/server/src/marketRuntime.js";

function runtimeAsset(runtime, assetId) {
  const asset = runtime.recoveryState().marketState.assets.find((candidate) => candidate.id === assetId);
  assert.ok(asset);
  return asset;
}

test("the real staged LUMA scaling miss creates a negative NOVA supplier spillover", () => {
  const initialState = createSeedMarket();
  const story = createMarketStory({
    id: "story-luma-real",
    publishedAt: 5_000,
    assets: initialState.assets,
    rng: () => 0.25
  });
  assert.equal(story.title, "LUMA battery breakthrough");
  assert.equal(story.updates[1]?.id, "story-luma-real:scaling");

  const runtime = createMarketRuntime({
    initialState: { ...initialState, stories: [story] },
    startedAtMs: 0,
    seed: 117,
    firstEventDelayMs: 600_000
  });

  runtime.advanceTo(5_000);
  const beforeScaling = structuredClone(runtimeAsset(runtime, "nova").expectations);

  runtime.advanceTo(65_000);
  const afterScaling = runtimeAsset(runtime, "nova");
  const recovery = runtime.recoveryState();
  const primary = recovery.marketState.activeEvents.find((event) => event.id === "story-luma-real:scaling");
  const secondary = recovery.marketState.activeEvents.find((event) => event.relationship?.sourceEventId === "story-luma-real:scaling");

  assert.ok(primary, "the real scaling follow-up should publish");
  assert.ok(primary.effect < 0, "LUMA scaling is a miss versus then-current LUMA expectations");
  assert.ok(secondary, "the published scaling update should create one NOVA relationship reaction");
  assert.ok(secondary.effect < 0, "NOVA must interpret the source surprise direction rather than the positive absolute outcome values");
  assert.ok(
    afterScaling.expectations.execution < beforeScaling.execution,
    "below-expectation LUMA execution should weaken NOVA execution expectations"
  );
});
