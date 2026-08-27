import type { MarketSnapshot, MarketState } from "../../../packages/shared/src/index.js";
import {
  createSeedMarket,
  createSeededRng,
  tickMarket,
  toMarketSnapshot,
  type PressureByAsset
} from "../../../packages/sim/src/index.js";

export type MarketSnapshotListener = (snapshot: MarketSnapshot) => void;
export type MarketClock = () => number;

export interface MarketScheduler {
  every(intervalMs: number, tick: () => void): () => void;
}

export interface MarketRuntimeOptions {
  initialState?: MarketState;
  seed?: number;
  startedAtMs?: number;
  clock?: MarketClock;
  scheduler?: MarketScheduler;
  tickIntervalMs?: number;
}

export interface MarketRuntime {
  snapshot(): MarketSnapshot;
  advanceTo(nowMs: number, pressureByAsset?: PressureByAsset): MarketSnapshot;
  subscribe(listener: MarketSnapshotListener): () => void;
  start(): void;
  stop(): void;
}

const DEFAULT_SEED = 0x4d41524b;
const DEFAULT_TICK_INTERVAL_MS = 5_000;
const NO_PRESSURE: PressureByAsset = {};
const SYSTEM_CLOCK: MarketClock = () => Date.now();
const SYSTEM_SCHEDULER: MarketScheduler = {
  every(intervalMs, tick) {
    const handle = setInterval(tick, intervalMs);
    return () => clearInterval(handle);
  }
};

export function createMarketRuntime(options: MarketRuntimeOptions = {}): MarketRuntime {
  let state = options.initialState ?? createSeedMarket();
  const rng = createSeededRng(options.seed ?? DEFAULT_SEED);
  const clock = options.clock ?? SYSTEM_CLOCK;
  const scheduler = options.scheduler ?? SYSTEM_SCHEDULER;
  const tickIntervalMs = options.tickIntervalMs ?? DEFAULT_TICK_INTERVAL_MS;
  let lastAdvancedAtMs = options.startedAtMs ?? clock();
  let cancelScheduledTick: (() => void) | undefined;
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

  function start(): void {
    if (cancelScheduledTick) return;
    cancelScheduledTick = scheduler.every(tickIntervalMs, () => {
      advanceTo(clock());
    });
  }

  function stop(): void {
    if (!cancelScheduledTick) return;
    cancelScheduledTick();
    cancelScheduledTick = undefined;
  }

  return { snapshot, advanceTo, subscribe, start, stop };
}
