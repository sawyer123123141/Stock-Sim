import test from "node:test";
import assert from "node:assert/strict";
import { toMarketStorySnapshots } from "../dist/packages/sim/src/market.js";
import { createMarketStory } from "../dist/packages/sim/src/eventGenerator.js";
import { createSeedMarket } from "../dist/packages/sim/src/fixtures.js";
import { createMarketRuntime } from "../dist/apps/server/src/marketRuntime.js";

test("public story snapshots include only information that has been published", () => {
  const snapshots = toMarketStorySnapshots([
    {
      id: "story-nova-launch",
      title: "NOVA's commuter launch",
      target: { kind: "asset", value: "nova" },
      status: "developing",
      updates: [
        {
          id: "story-nova-launch:demand",
          title: "Strong showroom demand reported",
          summary: "Early buyers are showing strong interest.",
          publishedAt: 5_000,
          state: "published",
          outcome: { demand: 1 },
          expectedOutcome: { demand: 0.75 },
          surprise: 0.125,
          effect: 0.2,
          significance: "normal"
        },
        {
          id: "story-nova-launch:production",
          title: "Future production details",
          summary: "This must not be visible yet.",
          publishedAt: 65_000,
          state: "pending",
          outcome: { execution: -0.4 },
          significance: "major"
        }
      ]
    }
  ], 5_000);

  assert.deepEqual(snapshots, [{
    id: "story-nova-launch",
    title: "NOVA's commuter launch",
    target: { kind: "asset", value: "nova" },
    status: "developing",
    updates: [{
      id: "story-nova-launch:demand",
      title: "Strong showroom demand reported",
      summary: "Early buyers are showing strong interest.",
      publishedAt: "1970-01-01T00:00:05.000Z"
    }]
  }]);

  const publicJson = JSON.stringify(snapshots);
  assert.doesNotMatch(publicJson, /Future production|not be visible|outcome|expectedOutcome|surprise|effect|significance/);
});

test("stock story plans keep future update reactions unresolved until publication", () => {
  const story = createMarketStory({
    id: "story-1",
    publishedAt: 5_000,
    rng: () => 0,
    assets: createSeedMarket().assets
  });

  assert.equal(story.id, "story-1");
  assert.equal(story.target.value, "nova");
  assert.equal(story.updates.length, 2);
  assert.deepEqual(story.updates.map((update) => update.id), [
    "story-1:demand",
    "story-1:production"
  ]);
  assert.ok(story.updates[0].publishedAt < story.updates[1].publishedAt);
  assert.equal("expectedOutcome" in story.updates[1], false);
  assert.equal("surprise" in story.updates[1], false);
  assert.equal("effect" in story.updates[1], false);
});

test("routine global information remains a simple one-update story", () => {
  const story = createMarketStory({
    id: "story-global",
    publishedAt: 5_000,
    rng: () => 0.91,
    assets: createSeedMarket().assets
  });

  assert.equal(story.target.kind, "global");
  assert.equal(story.updates.length, 1);
  assert.equal(story.updates[0].id, "story-global:initial");
});

test("a story update snapshots expectations only when its canonical publication time arrives", () => {
  const seed = createSeedMarket();
  const runtime = createMarketRuntime({
    initialState: {
      ...seed,
      stories: [{
        id: "story-1",
        title: "NOVA demand develops",
        target: { kind: "asset", value: "nova" },
        status: "developing",
        updates: [
          {
            id: "story-1:first",
            title: "Strong demand reported",
            summary: "Demand is stronger than expected.",
            publishedAt: 5_000,
            state: "pending",
            outcome: { demand: 1 },
            significance: "normal"
          },
          {
            id: "story-1:second",
            title: "Demand outlook revised",
            summary: "The next demand update arrives later.",
            publishedAt: 65_000,
            state: "pending",
            outcome: { demand: 0.6 },
            significance: "normal"
          }
        ]
      }]
    },
    startedAtMs: 0,
    firstEventDelayMs: 1_000_000
  });

  assert.equal(runtime.advanceTo(4_999).stories.length, 0);
  const firstPublic = runtime.advanceTo(5_000);
  assert.equal(firstPublic.stories[0].updates.length, 1);
  assert.equal(
    runtime.recoveryState().marketState.activeEvents.filter((event) => !event.relationship).length,
    1,
    "the published update still materializes exactly one primary event"
  );

  const beforeSecond = runtime.recoveryState().marketState.stories[0].updates[1];
  assert.equal("expectedOutcome" in beforeSecond, false);
  runtime.advanceTo(65_000);

  const second = runtime.recoveryState().marketState.stories[0].updates[1];
  assert.equal(second.state, "published");
  assert.equal(second.expectedOutcome.demand, 0.8);
  assert.deepEqual(runtime.recoveryState().appliedInformationIds, [
    "story-1:first",
    "relationship:story-1:first:nova-luma-customer:luma",
    "story-1:second",
    "relationship:story-1:second:nova-luma-customer:luma"
  ]);
});

test("a pending update publishes before a same-time generated story snapshots expectations", () => {
  const seed = createSeedMarket();
  const runtime = createMarketRuntime({
    initialState: {
      ...seed,
      stories: [{
        id: "existing-story",
        title: "Existing NOVA information",
        target: { kind: "asset", value: "nova" },
        status: "developing",
        updates: [{
          id: "existing-story:update",
          title: "Demand update",
          summary: "Demand becomes clear first.",
          publishedAt: 10_000,
          state: "pending",
          outcome: { demand: 1 },
          significance: "normal"
        }]
      }]
    },
    seed: 7,
    startedAtMs: 0,
    firstEventDelayMs: 10_000,
    eventIntervalMs: 100_000
  });

  runtime.advanceTo(10_000);
  const generatedDemandReaction = runtime.recoveryState().marketState.activeEvents
    .find((event) => event.id === "story-1:demand");

  assert.equal(generatedDemandReaction.expectedOutcome.demand, 0.8);
  assert.deepEqual(runtime.recoveryState().appliedInformationIds, [
    "existing-story:update",
    "relationship:existing-story:update:nova-luma-customer:luma",
    "story-1:demand",
    "relationship:story-1:demand:nova-luma-customer:luma"
  ]);
});

test("story plans and publication history survive restart and dormant canonical catch-up", () => {
  const createRuntime = () => createMarketRuntime({
    initialState: createSeedMarket(),
    seed: 1,
    startedAtMs: 0,
    firstEventDelayMs: 5_000,
    eventIntervalMs: 120_000,
    tickIntervalMs: 5_000
  });
  const continuous = createRuntime();
  for (let atMs = 5_000; atMs <= 125_000; atMs += 5_000) continuous.advanceTo(atMs);

  const restarted = createRuntime();
  for (let atMs = 5_000; atMs <= 60_000; atMs += 5_000) restarted.advanceTo(atMs);
  const recovered = createMarketRuntime({ recoveryState: restarted.recoveryState() });
  for (let atMs = 65_000; atMs <= 125_000; atMs += 5_000) recovered.advanceTo(atMs);

  assert.deepEqual(recovered.recoveryState(), continuous.recoveryState());
  const story = recovered.recoveryState().marketState.stories[0];
  assert.equal(story.status, "resolved");
  assert.equal(story.updates.every((update) => update.state === "published"), true);
});

test("legacy recovery preserves old information markers without creating follow-up stories", () => {
  const original = createMarketRuntime({ initialState: createSeedMarket(), seed: 7, startedAtMs: 0 });
  original.advanceTo(5_000);
  const legacy = structuredClone(original.recoveryState());
  delete legacy.marketState.stories;
  delete legacy.appliedInformationIds;
  legacy.appliedEventIds = ["legacy-event"];

  const recovered = createMarketRuntime({ recoveryState: legacy });
  const state = recovered.recoveryState();
  assert.deepEqual(state.marketState.stories, []);
  assert.equal(state.rngState, legacy.rngState);
  assert.equal(state.lastAdvancedAtMs, legacy.lastAdvancedAtMs);
  assert.deepEqual(state.appliedInformationIds, ["legacy-event"]);
});
