import test from "node:test";
import assert from "node:assert/strict";
import { createSeedMarket } from "../dist/packages/sim/src/fixtures.js";
import { combinedEventEffect, eventEffectForAsset } from "../dist/packages/sim/src/events.js";
import { toMarketSnapshot } from "../dist/packages/sim/src/market.js";

const market = createSeedMarket();
const nova = market.assets.find((asset) => asset.id === "nova");
const luma = market.assets.find((asset) => asset.id === "luma");
const pulse = market.assets.find((asset) => asset.id === "pulse");
const orbit = market.assets.find((asset) => asset.id === "orbit");

const novaEvent = {
  id: "nova-launch",
  title: "Nova's commuter launch draws a crowd",
  summary: "Early showroom interest is strong, but production follow-through is still unknown.",
  effect: 0.6,
  publishedAt: 1_000,
  reactionStartsAt: 2_000,
  expiresAt: 6_000,
  target: { kind: "asset", value: "nova" }
};

test("a public event stays quiet before reaction, then builds and fades", () => {
  const earlySnapshot = toMarketSnapshot({ ...market, activeEvents: [novaEvent] }, 1_500);
  assert.equal(earlySnapshot.events[0].id, "nova-launch");
  assert.equal(eventEffectForAsset(novaEvent, nova, 1_500), 0);

  const afterReactionStarts = eventEffectForAsset(novaEvent, nova, 3_000);
  const nearExpiry = eventEffectForAsset(novaEvent, nova, 5_800);
  assert.ok(afterReactionStarts > 0, "reaction should build after its public lead time");
  assert.ok(nearExpiry > 0 && nearExpiry < afterReactionStarts, "reaction should fade before expiry");
  assert.equal(eventEffectForAsset(novaEvent, nova, 6_000), 0);
});

test("asset, sector, and global events affect only their intended assets", () => {
  const sectorEvent = {
    ...novaEvent,
    id: "crypto-tailwind",
    target: { kind: "sector", value: "Crypto" }
  };
  const globalEvent = {
    ...novaEvent,
    id: "market-confidence",
    target: { kind: "global" }
  };

  assert.ok(eventEffectForAsset(novaEvent, nova, 3_000) > 0);
  assert.equal(eventEffectForAsset(novaEvent, luma, 3_000), 0);
  assert.ok(eventEffectForAsset(sectorEvent, pulse, 3_000) > 0);
  assert.ok(eventEffectForAsset(sectorEvent, orbit, 3_000) > 0);
  assert.equal(eventEffectForAsset(sectorEvent, nova, 3_000), 0);
  assert.ok(eventEffectForAsset(globalEvent, nova, 3_000) > 0);
  assert.ok(eventEffectForAsset(globalEvent, pulse, 3_000) > 0);
});

test("overlapping events retain a bounded combined effect", () => {
  const overlappingEvents = Array.from({ length: 4 }, (_, index) => ({
    ...novaEvent,
    id: `nova-overlap-${index}`,
    effect: 0.8
  }));

  assert.ok(combinedEventEffect(overlappingEvents, nova, 3_000) <= 1);
  assert.ok(combinedEventEffect(overlappingEvents, nova, 3_000) >= -1);
});

test("public market snapshots expose news metadata without internal effect strength", () => {
  const snapshot = toMarketSnapshot({
    ...market,
    activeEvents: [novaEvent]
  }, 3_000);

  assert.deepEqual(snapshot.events, [{
    id: "nova-launch",
    title: "Nova's commuter launch draws a crowd",
    summary: "Early showroom interest is strong, but production follow-through is still unknown.",
    target: { kind: "asset", value: "nova" },
    publishedAt: "1970-01-01T00:00:01.000Z",
    reactionStartsAt: "1970-01-01T00:00:02.000Z",
    expiresAt: "1970-01-01T00:00:06.000Z"
  }]);
  assert.equal("effect" in snapshot.events[0], false);
});
