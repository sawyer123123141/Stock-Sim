import test from "node:test";
import assert from "node:assert/strict";
import {
  COMPANY_RELATIONSHIPS,
  createSeedMarket,
  deriveRelationshipImpact,
  applyRelationshipExpectationImpact,
  relationshipInformationId
} from "../dist/packages/sim/src/index.js";
import { createMarketRuntime } from "../dist/apps/server/src/marketRuntime.js";
import { createInitialGameState, createPersistentGameAuthority } from "../dist/apps/server/src/persistentGameAuthority.js";

const EXPECTATION_DIMENSIONS = ["growth", "profitability", "demand", "execution"];

function mirroredExpectedOutcome(outcome) {
  return Object.fromEntries(EXPECTATION_DIMENSIONS.flatMap((dimension) => (
    typeof outcome[dimension] === "number" ? [[dimension, -outcome[dimension]]] : []
  )));
}

function sourceEvent(outcome) {
  return {
    id: "story-1:breakthrough",
    title: "Published information",
    summary: "Public information",
    effect: 0.45,
    publishedAt: 5_000,
    reactionStartsAt: 5_000,
    expiresAt: 155_000,
    target: { kind: "asset", value: "luma" },
    outcome,
    expectedOutcome: mirroredExpectedOutcome(outcome),
    significance: "major",
    consequenceVersion: 1
  };
}

test("the initial relationship network is directional and limited to the established LUMA/NOVA connection", () => {
  assert.deepEqual(COMPANY_RELATIONSHIPS.map((relationship) => ({
    id: relationship.id,
    from: relationship.fromAssetId,
    to: relationship.toAssetId,
    kind: relationship.kind,
    influence: relationship.influence
  })), [
    { id: "luma-nova-supplier", from: "luma", to: "nova", kind: "supplier", influence: "meaningful" },
    { id: "nova-luma-customer", from: "nova", to: "luma", kind: "customer", influence: "meaningful" }
  ]);
});

test("a published supplier beat creates smaller same-direction NOVA execution and growth expectations", () => {
  const relationship = COMPANY_RELATIONSHIPS.find((candidate) => candidate.id === "luma-nova-supplier");
  const impact = deriveRelationshipImpact(sourceEvent({ execution: 0.8, growth: 0.9, competitivePosition: 0.9 }), relationship);

  assert.deepEqual(impact.expectationDeltas, { execution: 0.112, growth: 0.07056 });
  assert.ok(impact.reactionEffect > 0);
  assert.ok(Math.abs(impact.reactionEffect) < 0.45);
  assert.equal(impact.targetAssetId, "nova");
  assert.equal(relationshipInformationId(sourceEvent({ execution: 0.8 }).id, relationship), "relationship:story-1:breakthrough:luma-nova-supplier:nova");
});

test("customer, competitor, and partner surprise rules remain directional and sparse", () => {
  const customer = { id: "customer", fromAssetId: "nova", toAssetId: "luma", kind: "customer", influence: "meaningful" };
  const competitor = { id: "competitor", fromAssetId: "alpha", toAssetId: "beta", kind: "competitor", influence: "important" };
  const partner = { id: "partner", fromAssetId: "alpha", toAssetId: "beta", kind: "partner", influence: "limited" };

  assert.deepEqual(
    deriveRelationshipImpact({ ...sourceEvent({ demand: 0.75, profitability: 1 }), target: { kind: "asset", value: "nova" } }, customer).expectationDeltas,
    { demand: 0.105 }
  );
  assert.deepEqual(
    deriveRelationshipImpact({ ...sourceEvent({ growth: 0.8, demand: 0.6, profitability: 1 }), target: { kind: "asset", value: "alpha" } }, competitor).expectationDeltas,
    { demand: -0.156 }
  );
  assert.deepEqual(
    deriveRelationshipImpact({ ...sourceEvent({ execution: -0.7, growth: 0.8, demand: 1 }), target: { kind: "asset", value: "alpha" } }, partner).expectationDeltas,
    { execution: -0.0448, growth: 0.03584 }
  );
});

test("relationship application changes only the connected stock expectations and never its fundamentals", () => {
  const state = createSeedMarket();
  const relationship = COMPANY_RELATIONSHIPS.find((candidate) => candidate.id === "luma-nova-supplier");
  const before = structuredClone(state.assets.find((asset) => asset.id === "nova"));
  const impact = deriveRelationshipImpact(sourceEvent({ execution: 0.8 }), relationship);
  const after = applyRelationshipExpectationImpact(state, impact).assets.find((asset) => asset.id === "nova");

  assert.deepEqual(after.fundamentals, before.fundamentals);
  assert.equal(after.expectations.execution, before.expectations.execution + 0.112);
  assert.equal(after.expectations.growth, before.expectations.growth);
});

function lumaStory() {
  return {
    id: "story-luma",
    title: "LUMA technology update",
    target: { kind: "asset", value: "luma" },
    status: "developing",
    updates: [{
      id: "story-luma:breakthrough",
      title: "LUMA confirms a battery breakthrough",
      summary: "The public update points to stronger execution and technology prospects.",
      publishedAt: 5_000,
      state: "pending",
      outcome: { execution: 0.8, competitivePosition: 0.9 },
      significance: "major"
    }]
  };
}

function runtimeWithLumaStory() {
  return createMarketRuntime({
    initialState: { ...createSeedMarket(), stories: [lumaStory()] },
    startedAtMs: 0,
    seed: 71,
    firstEventDelayMs: 60_000
  });
}

function runtimeWithPublishedStory({ id, sourceAssetId, outcome }) {
  return createMarketRuntime({
    initialState: {
      ...createSeedMarket(),
      stories: [{
        id,
        title: "Public company information",
        target: { kind: "asset", value: sourceAssetId },
        status: "developing",
        updates: [{
          id: `${id}:update`,
          title: "Published company update",
          summary: "Public information changes the near-term outlook.",
          publishedAt: 5_000,
          state: "pending",
          outcome,
          significance: "major"
        }]
      }]
    },
    startedAtMs: 0,
    seed: 92,
    firstEventDelayMs: 60_000
  });
}

function runtimeAsset(runtime, assetId) {
  const asset = runtime.recoveryState().marketState.assets.find((candidate) => candidate.id === assetId);
  assert.ok(asset);
  return asset;
}

test("a pending LUMA update creates no NOVA spillover until publication, then applies it once without recursion", () => {
  const runtime = runtimeWithLumaStory();
  const beforeNOVA = structuredClone(runtimeAsset(runtime, "nova"));

  runtime.advanceTo(4_999);
  assert.deepEqual(runtimeAsset(runtime, "nova").expectations, beforeNOVA.expectations);

  runtime.advanceTo(5_000);
  const published = runtime.recoveryState();
  const nova = runtimeAsset(runtime, "nova");
  const luma = runtimeAsset(runtime, "luma");
  const relationshipId = "relationship:story-luma:breakthrough:luma-nova-supplier:nova";
  assert.ok(nova.expectations.execution > beforeNOVA.expectations.execution);
  assert.deepEqual(nova.fundamentals, beforeNOVA.fundamentals);
  assert.equal(published.marketState.activeEvents.filter((event) => event.relationship).length, 1);
  const primary = published.marketState.activeEvents.find((event) => event.id === "story-luma:breakthrough");
  const secondary = published.marketState.activeEvents.find((event) => event.relationship);
  assert.ok(Math.abs(primary.effect) > Math.abs(secondary.effect), "the primary event remains stronger than the connected reaction");
  assert.equal(published.marketState.activeEvents.filter((event) => event.relationship?.sourceAssetId === "nova").length, 0);
  assert.ok(published.appliedInformationIds.includes(relationshipId));
  assert.deepEqual(
    published.marketState.stories[0].updates[0].relatedAssetIds,
    ["nova"]
  );
  assert.ok(luma.expectations.execution > 0, "the primary information still applies to LUMA directly");

  const once = structuredClone(nova.expectations);
  runtime.advanceTo(5_001);
  assert.deepEqual(runtimeAsset(runtime, "nova").expectations, once);
});

test("a related-company reaction becomes one qualitative movement reason after its normal event window starts", () => {
  const runtime = runtimeWithLumaStory();
  runtime.advanceTo(95_000);
  const nova = runtimeAsset(runtime, "nova");
  const relationshipReason = nova.reasons.find((reason) => reason.code === "relationship");

  assert.equal(relationshipReason?.label, "Related company");
  assert.match(relationshipReason?.summary ?? "", /Luma Labs/);
  assert.doesNotMatch(relationshipReason?.summary ?? "", /0\.\d|coefficient|spillover/i);
});

test("legacy published story state never acquires a new relationship consequence during recovery", () => {
  const runtime = runtimeWithLumaStory();
  runtime.advanceTo(5_000);
  const legacy = structuredClone(runtime.recoveryState());
  legacy.marketState.stories[0].updates[0].relatedAssetIds = undefined;
  legacy.marketState.activeEvents = legacy.marketState.activeEvents.filter((event) => !event.relationship);
  legacy.appliedInformationIds = ["story-luma:breakthrough"];
  legacy.appliedEventIds = ["story-luma:breakthrough"];
  const recovered = createMarketRuntime({ recoveryState: legacy });

  recovered.advanceTo(10_000);
  assert.deepEqual(recovered.recoveryState().appliedInformationIds, ["story-luma:breakthrough"]);
  assert.equal(recovered.recoveryState().marketState.activeEvents.filter((event) => event.relationship).length, 0, "legacy information does not gain a new secondary reaction");
});

test("a LUMA scaling miss weakens NOVA execution expectations without changing NOVA fundamentals", () => {
  const runtime = runtimeWithPublishedStory({ id: "luma-scaling", sourceAssetId: "luma", outcome: { execution: -0.75 } });
  const before = structuredClone(runtimeAsset(runtime, "nova"));
  runtime.advanceTo(5_000);
  const nova = runtimeAsset(runtime, "nova");

  assert.equal(nova.expectations.execution, before.expectations.execution - 0.098);
  assert.deepEqual(nova.fundamentals, before.fundamentals);
});

test("a NOVA demand beat improves LUMA demand expectations as a smaller customer spillover", () => {
  const runtime = runtimeWithPublishedStory({ id: "nova-demand", sourceAssetId: "nova", outcome: { demand: 0.9 } });
  const before = structuredClone(runtimeAsset(runtime, "luma"));
  runtime.advanceTo(5_000);
  const luma = runtimeAsset(runtime, "luma");

  assert.equal(luma.expectations.demand, before.expectations.demand + 0.0105);
  assert.deepEqual(luma.fundamentals, before.fundamentals);
});

test("relationship recovery and dormant catch-up preserve one canonical result", async () => {
  class LockedMemoryStore {
    constructor(state) { this.state = structuredClone(state); }
    async transact(mutation) { return mutation(this.state); }
  }
  const session = () => {
    let nowMs = 0;
    const state = createInitialGameState(0);
    state.runtime = runtimeWithLumaStory().recoveryState();
    const store = new LockedMemoryStore(state);
    return { store, setNow(value) { nowMs = value; }, authority: () => createPersistentGameAuthority(store, () => nowMs) };
  };
  const continuous = session();
  continuous.setNow(5_000);
  await continuous.authority().getMarket();
  continuous.setNow(10_000);
  await continuous.authority().getMarket();

  const dormant = session();
  dormant.setNow(10_000);
  await dormant.authority().getMarket();

  const restarted = session();
  restarted.setNow(5_000);
  await restarted.authority().getMarket();
  restarted.setNow(10_000);
  await restarted.authority().getMarket();

  assert.deepEqual(dormant.store.state.runtime, continuous.store.state.runtime);
  assert.deepEqual(restarted.store.state.runtime, continuous.store.state.runtime);
});

test("public snapshots expose only broad relationship context and published related story targets", () => {
  const runtime = runtimeWithLumaStory();
  runtime.advanceTo(5_000);
  const snapshot = runtime.snapshot();
  const json = JSON.stringify(snapshot);
  const nova = snapshot.assets.find((asset) => asset.id === "nova");
  const luma = snapshot.assets.find((asset) => asset.id === "luma");
  const crypto = snapshot.assets.find((asset) => asset.id === "pulse");

  assert.match(json, /relatedAssetIds/);
  assert.deepEqual(nova.relationships, [{ assetId: "luma", name: "Luma Labs", symbol: "LUMA", kind: "supplier", importance: "meaningful" }]);
  assert.deepEqual(luma.relationships, [{ assetId: "nova", name: "Nova Motors", symbol: "NOVA", kind: "customer", importance: "meaningful" }]);
  assert.equal(crypto.relationships, undefined);
  assert.doesNotMatch(json, /luma-nova-supplier|reactionEffect|expectationDeltas|appliedInformationIds|influence.*0\.14/);
});
