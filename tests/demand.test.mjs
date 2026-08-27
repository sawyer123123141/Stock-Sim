import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDemandPressure } from '../dist/packages/sim/src/demand.js';

test('extreme player pressure is bounded', () => {
  assert.ok(calculateDemandPressure({ simulated: 0, player: 999 }) <= 0.25);
  assert.ok(calculateDemandPressure({ simulated: 0, player: -999 }) >= -0.25);
});

test('simulated demand remains dominant', () => {
  assert.ok(calculateDemandPressure({ simulated: 0.8, player: -999 }) > 0.3);
});
