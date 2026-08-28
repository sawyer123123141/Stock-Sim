import type { MarketPressure, MarketSnapshot, MarketState, TradeSide } from "../../../packages/shared/src/index.js";
import {
  EVENT_CADENCE_MS,
  calculateSimulatedInvestorPressure,
  combinedEventEffect,
  FIRST_EVENT_DELAY_MS,
  calculateMarketRead,
  createMarketEvent,
  createSeedMarket,
  createSeededRng,
  tickMarket,
  toMarketSnapshot,
  type MarketReadByAsset,
  type PressureByAsset
} from "../../../packages/sim/src/index.js";
import { createPlayerPressureBook } from "./playerPressure.js";

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
  firstEventDelayMs?: number;
  eventIntervalMs?: number;
}

export interface MarketRuntime {
  snapshot(): MarketSnapshot;
  advanceTo(nowMs: number, pressureByAsset?: PressureByAsset): MarketSnapshot;
  recordPlayerTrade(assetId: string, side: TradeSide, quantity: number, executedAtMs: number): void;
  playerPressureForAsset(assetId: string, nowMs: number): number;
  simulatedPressureForAsset(assetId: string, nowMs: number): number;
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
  const firstEventDelayMs = options.firstEventDelayMs ?? FIRST_EVENT_DELAY_MS;
  const eventIntervalMs = options.eventIntervalMs ?? EVENT_CADENCE_MS;
  let nextEventAtMs = lastAdvancedAtMs + firstEventDelayMs;
  let eventCount = 0;
  let cancelScheduledTick: (() => void) | undefined;
  const listeners = new Set<MarketSnapshotListener>();
  const playerPressure = createPlayerPressureBook();

  function snapshot(): MarketSnapshot {
    return toMarketSnapshot(state, lastAdvancedAtMs, currentMarketReads(lastAdvancedAtMs));
  }

  function currentMarketReads(nowMs: number): MarketReadByAsset {
    return Object.fromEntries(state.assets.map((asset) => [
      asset.id,
      calculateMarketRead(asset, {
        simulated: calculateSimulatedInvestorPressure(
          asset,
          combinedEventEffect(state.activeEvents, asset, nowMs)
        ),
        player: playerPressure.pressureForAsset(asset.id, nowMs)
      })
    ]));
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

    while (nextEventAtMs <= nowMs) {
      eventCount += 1;
      state = {
        ...state,
        activeEvents: [...state.activeEvents, createMarketEvent({
          id: `event-${eventCount}`,
          publishedAt: nextEventAtMs,
          rng
        })]
      };
      nextEventAtMs += eventIntervalMs;
    }

    const deltaMs = nowMs - lastAdvancedAtMs;
    const combinedPressureByAsset: Record<string, MarketPressure> = {};
    for (const asset of state.assets) {
      const supplied = pressureByAsset[asset.id];
      const simulated = calculateSimulatedInvestorPressure(
        asset,
        combinedEventEffect(state.activeEvents, asset, nowMs)
      );
      combinedPressureByAsset[asset.id] = {
        simulated: simulated + (supplied?.simulated ?? 0),
        player: playerPressure.pressureForAsset(asset.id, nowMs) + (supplied?.player ?? 0)
      };
    }
    state = tickMarket(state, nowMs, deltaMs, combinedPressureByAsset, rng);
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

  function recordPlayerTrade(
    assetId: string,
    side: TradeSide,
    quantity: number,
    executedAtMs: number
  ): void {
    playerPressure.recordTrade(assetId, side, quantity, executedAtMs);
  }

  function playerPressureForAsset(assetId: string, nowMs: number): number {
    return playerPressure.pressureForAsset(assetId, nowMs);
  }

  function simulatedPressureForAsset(assetId: string, nowMs: number): number {
    const asset = state.assets.find((candidate) => candidate.id === assetId);
    if (!asset) return 0;
    return calculateSimulatedInvestorPressure(
      asset,
      combinedEventEffect(state.activeEvents, asset, nowMs)
    );
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

  return {
    snapshot,
    advanceTo,
    recordPlayerTrade,
    playerPressureForAsset,
    simulatedPressureForAsset,
    subscribe,
    start,
    stop
  };
}
