import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeedMarket } from '../dist/packages/sim/src/fixtures.js';
import { eventEffectForAsset } from '../dist/packages/sim/src/events.js';

const market = createSeedMarket();
const nova = market.assets.find((asset) => asset.id === 'nova');
const luma = market.assets.find((asset) => asset.id === 'luma');
const event = {
  id: 'nova-launch',
  title: 'Nova launch praised',
  summary: 'Early reviews are strong.',
  effect: 0.8,
  startsAt: 1000,
  expiresAt: 2000,
  target: { kind: 'asset', value: 'nova' }
};

test('targeted event affects only its asset and decays', () => {
  assert.ok(eventEffectForAsset(event, nova, 1000) > 0.79);
  assert.equal(eventEffectForAsset(event, luma, 1000), 0);
  assert.ok(eventEffectForAsset(event, nova, 1500) > 0.39);
  assert.equal(eventEffectForAsset(event, nova, 2000), 0);
});
