import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeededRng } from '../dist/packages/sim/src/rng.js';

test('seeded RNG replays the same sequence', () => {
  const a = createSeededRng(12345);
  const b = createSeededRng(12345);
  assert.deepEqual([a(), a(), a(), a()], [b(), b(), b(), b()]);
});
