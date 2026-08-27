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
