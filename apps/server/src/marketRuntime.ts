import type { MarketSnapshot, MarketState } from "../../../packages/shared/src/index.js";
import {
  createSeedMarket,
  createSeededRng,
  tickMarket,
  toMarketSnapshot,
  type PressureByAsset
} from "../../../packages/sim/src/index.js";

export type MarketSnapshotListener = (snapshot: MarketSnapshot) => void;

export interface MarketRuntimeOptions {
  initialState?: MarketState;
  seed?: number;
  startedAtMs?: number;
}

export interface MarketRuntime {
  snapshot(): MarketSnapshot;
  advanceTo(nowMs: number, pressureByAsset?: PressureByAsset): MarketSnapshot;
  subscribe(listener: MarketSnapshotListener): () => void;
}

const DEFAULT_SEED = 0x4d41524b;
const NO_PRESSURE: PressureByAsset = {};

export function createMarketRuntime(options: MarketRuntimeOptions = {}): MarketRuntime {
  let state = options.initialState ?? createSeedMarket();
  const rng = createSeededRng(options.seed ?? DEFAULT_SEED);
  let lastAdvancedAtMs = options.startedAtMs ?? Date.now();
  const listeners = new Set<MarketSnapshotListener>();

  function snapshot(): MarketSnapshot {
    return toMarketSnapshot(state, lastAdvancedAtMs);
  }

  function advanceTo(
    nowMs: number,
    pressureByAsset: PressureByAsset = NO_PRESSURE
  ): MarketSnapshot {
    if (!Number.isFinite(nowMs)) {
      throw new RangeError("Market time must be a finite millisecond timestamp.");
    }

    if (nowMs <= lastAdvancedAtMs) {
      return snapshot();
    }

    const deltaMs = nowMs - lastAdvancedAtMs;
    state = tickMarket(state, nowMs, deltaMs, pressureByAsset, rng);
    lastAdvancedAtMs = nowMs;

    const nextSnapshot = snapshot();
    for (const listener of listeners) {
      listener(nextSnapshot);
    }
    return nextSnapshot;
  }

  function subscribe(listener: MarketSnapshotListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return { snapshot, advanceTo, subscribe };
}
