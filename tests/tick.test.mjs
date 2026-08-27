import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeedMarket } from '../dist/packages/sim/src/fixtures.js';
import { createSeededRng } from '../dist/packages/sim/src/rng.js';
import { tickAsset } from '../dist/packages/sim/src/tick.js';

const market = createSeedMarket();

test('strong stock conditions can produce an understandable positive move', () => {
  const stock = market.assets.find((asset) => asset.id === 'nova');
  const result = tickAsset(stock, { demand: { simulated: 0.6, player: 2 }, eventEffect: 0.7 }, createSeededRng(4));
  assert.ok(result.asset.price > stock.price);
  assert.ok(Math.abs(result.returnFraction) <= 0.03);
  assert.ok(result.asset.reasons.length > 0);
});

test('crypto is more volatile than stock across the same replay length', () => {
  let stock = structuredClone(market.assets.find((asset) => asset.id === 'nova'));
  let coin = structuredClone(market.assets.find((asset) => asset.id === 'pulse'));
  const stockRng = createSeededRng(777);
  const coinRng = createSeededRng(777);
  let stockAbs = 0;
  let coinAbs = 0;

  for (let i = 0; i < 100; i += 1) {
    const context = { demand: { simulated: 0.1, player: 0.1 }, eventEffect: 0 };
    const s = tickAsset(stock, context, stockRng);
    const c = tickAsset(coin, context, coinRng);
    stockAbs += Math.abs(s.returnFraction);
    coinAbs += Math.abs(c.returnFraction);
    stock = s.asset;
    coin = c.asset;
  }

  assert.ok(coinAbs / 100 > stockAbs / 100);
});
