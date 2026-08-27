import type { MarketSnapshot } from "../../../packages/shared/src/index.js";

export interface PriceSample {
  atMs: number;
  price: number;
}

export type PriceHistory = Record<string, PriceSample[]>;

export interface MarketSnapshotState {
  market: MarketSnapshot | null;
  priceHistory: PriceHistory;
}

const MAX_HISTORY_POINTS = 120;

export function applyMarketSnapshot(
  previous: MarketSnapshotState,
  snapshot: MarketSnapshot
): MarketSnapshotState {
  const atMs = Date.parse(snapshot.generatedAt);
  if (!Number.isFinite(atMs)) return previous;

  const previousAtMs = previous.market ? Date.parse(previous.market.generatedAt) : Number.NEGATIVE_INFINITY;
  if (Number.isFinite(previousAtMs) && atMs <= previousAtMs) return previous;

  const priceHistory = { ...previous.priceHistory };
  for (const asset of snapshot.assets) {
    const history = previous.priceHistory[asset.id] ?? [];
    const last = history[history.length - 1];
    if (last?.atMs === atMs) continue;

    priceHistory[asset.id] = [...history, { atMs, price: asset.price }].slice(-MAX_HISTORY_POINTS);
  }

  return { market: snapshot, priceHistory };
}
