import test from "node:test";
import assert from "node:assert/strict";
import {
  COMPANY_RELATIONSHIPS,
  createMarketStory,
  createSeedMarket,
  deriveRelationshipImpact,
  applyRelationshipExpectationImpact,
  relationshipInformationId
} from "../dist/packages/sim/src/index.js";
import { createMarketRuntime } from "../dist/apps/server/src/marketRuntime.js";
import { createInitialGameState, createPersistentGameAuthority } from "../dist/apps/server/src/persistentGameAuthority.js";

function sourceEvent(outcome, expectedOutcome = {}) {
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
    expectedOutcome,
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

test("a published supplier breakthrough uses execution information relative to expectations and absolute technology information", () => {
  const relationship = COMPANY_RELATIONSHIPS.find((candidate) => candidate.id === "luma-nova-supplier");
  const impact = deriveRelationshipImpact(
    sourceEvent({ execution: 0.8, competitivePosition: 0.9 }, { execution: 0.4 }),
    relationship
  );

  assert.deepEqual(impact.expectationDeltas, { execution: 0.056, growth: 0.07056 });
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
    deriveRelationshipImpact({ ...sourceEvent({ demand: 0.75, profitability: 1 }, { demand: 0.25 }), target: { kind: "asset", value: "nova" } }, customer).expectationDeltas,
    { demand: 0.07 }
  );
  assert.deepEqual(
    deriveRelationshipImpact({ ...sourceEvent({ competitivePosition: 0.8, demand: 0.6, profitability: 1 }, { demand: 0 }), target: { kind: "asset", value: "alpha" } }, competitor).expectationDeltas,
    { demand: -0.204 }
  );
  assert.deepEqual(
    deriveRelationshipImpact({ ...sourceEvent({ execution: -0.7, growth: 0.8, demand: 1 }, { execution: -0.1, growth: 0.3 }), target: { kind: "asset", value: "alpha" } }, partner).expectationDeltas,
    { execution: -0.0384, growth: 0.0224 }
  );
});

test("relationship interpretation follows dimension-level expectation surprises rather than absolute outcomes", () => {
  const supplier = { id: "supplier", fromAssetId: "alpha", toAssetId: "beta", kind: "supplier", influence: "meaningful" };
  const eventForAlpha = (outcome, expectedOutcome) => ({ ...sourceEvent(outcome, expectedOutcome), target: { kind: "asset", value: "alpha" } });
  const belowExpectations = deriveRelationshipImpact(eventForAlpha({ execution: 0.25 }, { execution: 0.75 }), supplier);
  const aboveExpectations = deriveRelationshipImpact(eventForAlpha({ execution: 0.25 }, { execution: 0.1 }), supplier);
  const matchedExpectations = deriveRelationshipImpact(eventForAlpha({ execution: 0.25 }, { execution: 0.25 }), supplier);
  const nearlyMatchedExpectations = deriveRelationshipImpact(eventForAlpha({ execution: 0.25 }, { execution: 0.24 }), supplier);

  assert.deepEqual(belowExpectations.expectationDeltas, { execution: -0.07 });
  assert.ok(belowExpectations.reactionEffect < 0, "a positive absolute execution result can still disappoint");
  assert.deepEqual(aboveExpectations.expectationDeltas, { execution: 0.021 });
  assert.ok(aboveExpectations.reactionEffect > 0);
  assert.equal(matchedExpectations, null, "information that exactly meets expectations has no supplier spillover");
  assert.deepEqual(nearlyMatchedExpectations.expectationDeltas, { execution: 0.0014 });
  assert.ok(Math.abs(nearlyMatchedExpectations.reactionEffect) < 0.002, "a near match creates only a negligible temporary reaction");
});

test("non-expectation dimensions remain explicit while mixed information stays relationship-specific", () => {
  const supplier = { id: "supplier", fromAssetId: "alpha", toAssetId: "beta", kind: "supplier", influence: "meaningful" };
  const customer = { id: "customer", fromAssetId: "alpha", toAssetId: "gamma", kind: "customer", influence: "meaningful" };
  const competitivePosition = deriveRelationshipImpact({ ...sourceEvent({ competitivePosition: 0.8 }), target: { kind: "asset", value: "alpha" } }, supplier);
  const mixed = { ...sourceEvent({ execution: 0.25, demand: 0.8 }, { execution: 0.65, demand: 0.3 }), target: { kind: "asset", value: "alpha" }, effect: -0.45 };
  const supplierImpact = deriveRelationshipImpact(mixed, supplier);
  const customerImpact = deriveRelationshipImpact(mixed, customer);

  assert.deepEqual(competitivePosition.expectationDeltas, { growth: 0.06272 });
  assert.ok(competitivePosition.reactionEffect > 0);
  assert.ok(supplierImpact.reactionEffect < 0, "supplier interpretation follows the execution miss");
  assert.ok(customerImpact.reactionEffect > 0, "customer interpretation follows the demand beat despite the primary event sign");
});

test("relationship application changes only the connected stock expectations and never its fundamentals", () => {
  const state = createSeedMarket();
  const relationship = COMPANY_RELATIONSHIPS.find((candidate) => candidate.id === "luma-nova-supplier");
  const before = structuredClone(state.assets.find((asset) => asset.id === "nova"));
  const impact = deriveRelationshipImpact(sourceEvent({ execution: 0.8 }, { execution: 0.4 }), relationship);
  const after = applyRelationshipExpectationImpact(state, impact).assets.find((asset) => asset.id === "nova");

  assert.deepEqual(after.fundamentals, before.fundamentals);
  assert.equal(after.expectations.execution, before.expectations.execution + 0.056);
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

test("the real LUMA scaling follow-up carries its execution miss through to NOVA", () => {
  const seed = createSeedMarket();
  const story = createMarketStory({
    id: "luma-breakthrough",
    publishedAt: 5_000,
    rng: () => 0.25,
    assets: seed.assets
  });
  assert.equal(story.title, "LUMA battery breakthrough");

  const runtime = createMarketRuntime({
    initialState: { ...seed, stories: [story] },
    startedAtMs: 0,
    seed: 101,
    firstEventDelayMs: 60_000
  });
  const initialNOVA = structuredClone(runtimeAsset(runtime, "nova"));

  runtime.advanceTo(5_000);
  const afterDemonstration = structuredClone(runtimeAsset(runtime, "nova"));
  const demonstration = runtime.recoveryState().marketState.activeEvents.find((event) => event.id === "luma-breakthrough:demonstration");
  assert.ok(demonstration.effect > 0);
  assert.ok(afterDemonstration.expectations.growth > initialNOVA.expectations.growth);
  assert.deepEqual(afterDemonstration.fundamentals, initialNOVA.fundamentals);

  runtime.advanceTo(65_000);
  const afterScaling = runtimeAsset(runtime, "nova");
  const scaling = runtime.recoveryState().marketState.activeEvents.find((event) => event.id === "luma-breakthrough:scaling");
  const relatedScaling = runtime.recoveryState().marketState.activeEvents.find((event) => event.relationship?.sourceEventId === "luma-breakthrough:scaling");

  assert.ok(scaling.effect < 0, "the real LUMA scaling update misses the high expectations captured at publication");
  assert.ok(afterScaling.expectations.execution < afterDemonstration.expectations.execution, "NOVA reads the positive-looking execution value as disappointing supplier information");
  assert.ok(relatedScaling.effect < 0, "the temporary NOVA reaction follows the supplier execution miss");
  assert.deepEqual(afterScaling.fundamentals, initialNOVA.fundamentals);
});

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

  assert.equal(nova.expectations.execution, before.expectations.execution - 0.14);
  assert.deepEqual(nova.fundamentals, before.fundamentals);
});

test("a NOVA demand beat improves LUMA demand expectations as a smaller customer spillover", () => {
  const runtime = runtimeWithPublishedStory({ id: "nova-demand", sourceAssetId: "nova", outcome: { demand: 0.9 } });
  const before = structuredClone(runtimeAsset(runtime, "luma"));
  runtime.advanceTo(5_000);
  const luma = runtimeAsset(runtime, "luma");

  assert.equal(luma.expectations.demand, before.expectations.demand + 0.021);
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
