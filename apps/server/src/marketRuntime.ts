import type { MarketPressure, MarketSnapshot, MarketState, TradeSide } from "../../../packages/shared/src/index.js";
import {
  EVENT_CADENCE_MS,
  calculateSimulatedInvestorPressure,
  combinedEventEffect,
  FIRST_EVENT_DELAY_MS,
  calculateMarketRead,
  createMarketEvent,
  createSeedMarket,
  createStatefulSeededRng,
  hydrateMarketCompanyReality,
  tickMarket,
  toMarketSnapshot,
  type MarketReadByAsset,
  type PressureByAsset
} from "../../../packages/sim/src/index.js";
import { createPlayerPressureBook, type TradeImpulse } from "./playerPressure.js";

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
  recoveryState?: MarketRuntimeRecoveryState;
}

export interface MarketRuntimeRecoveryState {
  marketState: MarketState;
  rngState: number;
  lastAdvancedAtMs: number;
  nextEventAtMs: number;
  eventCount: number;
  tickIntervalMs: number;
  firstEventDelayMs: number;
  eventIntervalMs: number;
  playerPressure: Record<string, TradeImpulse[]>;
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
  recoveryState(): MarketRuntimeRecoveryState;
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
  const recovery = options.recoveryState;
  let state = hydrateMarketCompanyReality(recovery?.marketState ?? options.initialState ?? createSeedMarket());
  const rng = createStatefulSeededRng(recovery?.rngState ?? options.seed ?? DEFAULT_SEED);
  const clock = options.clock ?? SYSTEM_CLOCK;
  const scheduler = options.scheduler ?? SYSTEM_SCHEDULER;
  const tickIntervalMs = recovery?.tickIntervalMs ?? options.tickIntervalMs ?? DEFAULT_TICK_INTERVAL_MS;
  let lastAdvancedAtMs = recovery?.lastAdvancedAtMs ?? options.startedAtMs ?? clock();
  const firstEventDelayMs = recovery?.firstEventDelayMs ?? options.firstEventDelayMs ?? FIRST_EVENT_DELAY_MS;
  const eventIntervalMs = recovery?.eventIntervalMs ?? options.eventIntervalMs ?? EVENT_CADENCE_MS;
  let nextEventAtMs = recovery?.nextEventAtMs ?? lastAdvancedAtMs + firstEventDelayMs;
  let eventCount = recovery?.eventCount ?? 0;
  let cancelScheduledTick: (() => void) | undefined;
  const listeners = new Set<MarketSnapshotListener>();
  const playerPressure = createPlayerPressureBook(recovery?.playerPressure);

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

  function recoveryState(): MarketRuntimeRecoveryState {
    return {
      marketState: state,
      rngState: rng.state(),
      lastAdvancedAtMs,
      nextEventAtMs,
      eventCount,
      tickIntervalMs,
      firstEventDelayMs,
      eventIntervalMs,
      playerPressure: playerPressure.recoveryState()
    };
  }

  return {
    snapshot,
    advanceTo,
    recordPlayerTrade,
    playerPressureForAsset,
    simulatedPressureForAsset,
    subscribe,
    start,
    stop,
    recoveryState
  };
}
