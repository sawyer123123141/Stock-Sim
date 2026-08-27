import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeedMarket } from '../dist/packages/sim/src/fixtures.js';
import { createSeededRng } from '../dist/packages/sim/src/rng.js';
import { tickMarket } from '../dist/packages/sim/src/market.js';

function replay() {
  let market = createSeedMarket();
  const rng = createSeededRng(99117);
  const pressure = {
    nova: { simulated: 0.25, player: 0.5 },
    pulse: { simulated: -0.1, player: 0.8 }
  };
  for (let i = 0; i < 200; i += 1) {
    market = tickMarket(market, 1_000_000 + i * 1000, pressure, rng);
  }
  return market;
}

test('the same inputs and seed replay exactly', () => {
  assert.deepEqual(replay(), replay());
});
