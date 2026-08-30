import test from 'node:test';
import assert from 'node:assert/strict';
import { explainMovement } from '../dist/packages/sim/src/explain.js';

test('movement explanations rank strongest cause and stay plain-language', () => {
  const reasons = explainMovement([
    { code: 'sector', label: 'Sector trend', value: 0.001, summaryUp: 'The wider sector is helping.', summaryDown: 'The wider sector is hurting.' },
    { code: 'news', label: 'News and events', value: 0.004, summaryUp: 'Positive news is attracting investors.', summaryDown: 'Negative news is pushing investors away.' }
  ]);
  assert.equal(reasons[0].code, 'news');
  assert.equal(reasons[0].direction, 'up');
  assert.match(reasons[0].summary, /Positive news/);
  assert.doesNotMatch(reasons[0].summary, /P\/E|RSI|EPS/);
});

test('an information reason compresses same-direction market follow-through while preserving an opposing cause', () => {
  const reasons = explainMovement([
    { code: 'relationship', label: 'Related company', value: -0.004, summaryUp: 'Related company support.', summaryDown: 'Related company concern.' },
    { code: 'demand', label: 'Buying pressure', value: -0.003, summaryUp: 'Buyers are active.', summaryDown: 'Sellers are active.' },
    { code: 'momentum', label: 'Recent momentum', value: -0.002, summaryUp: 'Recent gains.', summaryDown: 'Recent losses.' },
    { code: 'sector', label: 'Sector trend', value: 0.001, summaryUp: 'The sector is helping.', summaryDown: 'The sector is hurting.' }
  ]);

  assert.deepEqual(reasons.map((reason) => reason.code), ['relationship', 'sector']);
  assert.equal(reasons[0].summary, 'Related company concern.');
  assert.equal(reasons[1].direction, 'up');
});
