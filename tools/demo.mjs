import { createSeedMarket, createSeededRng, tickMarket, toMarketSnapshot } from '../dist/packages/sim/src/index.js';

let market = createSeedMarket();
const rng = createSeededRng(20260826);
const pressures = {
  nova: { simulated: 0.35, player: 0.2 },
  luma: { simulated: 0.15, player: -0.1 },
  pulse: { simulated: 0.2, player: 0.7 },
  orbit: { simulated: -0.05, player: 0.1 }
};

market.activeEvents.push({
  id: 'nova-review',
  title: 'Nova prototype reviews impress',
  summary: 'Early reviewers are more positive than expected.',
  effect: 0.75,
  startsAt: 0,
  expiresAt: 90_000,
  target: { kind: 'asset', value: 'nova' }
});

for (let tick = 0; tick < 20; tick += 1) {
  market = tickMarket(market, tick * 2_000, 2_000, pressures, rng);
}

const snapshot = toMarketSnapshot(market, 40_000);
for (const asset of snapshot.assets) {
  const sign = asset.lastTickChangePct >= 0 ? '+' : '';
  console.log(`${asset.symbol.padEnd(5)} $${asset.price.toFixed(asset.kind === 'crypto' ? 4 : 2)}  ${sign}${asset.lastTickChangePct.toFixed(2)}%`);
  for (const reason of asset.reasons.slice(0, 2)) console.log(`  - ${reason.summary}`);
}
