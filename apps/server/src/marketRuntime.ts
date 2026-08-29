import type { MarketEvent, MarketPressure, MarketSnapshot, MarketState, TradeSide } from "../../../packages/shared/src/index.js";
import {
  EVENT_CADENCE_MS,
  calculateSimulatedInvestorPressure,
  combinedEventEffect,
  FIRST_EVENT_DELAY_MS,
  calculateMarketRead,
  applyStockEventConsequences,
  createMarketStory,
  createSeedMarket,
  createStatefulSeededRng,
  hydrateMarketCompanyReality,
  publishMarketStoryUpdate,
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
  /** Information whose versioned consequences were applied at canonical publication. */
  appliedInformationIds?: string[];
  /** Legacy recovery alias retained for already-persisted runtimes and consumers. */
  appliedEventIds?: string[];
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
  const initialState = recovery?.marketState ?? options.initialState ?? createSeedMarket();
  let state = hydrateMarketCompanyReality({ ...initialState, stories: initialState.stories ?? [] });
  const rng = createStatefulSeededRng(recovery?.rngState ?? options.seed ?? DEFAULT_SEED);
  const clock = options.clock ?? SYSTEM_CLOCK;
  const scheduler = options.scheduler ?? SYSTEM_SCHEDULER;
  const tickIntervalMs = recovery?.tickIntervalMs ?? options.tickIntervalMs ?? DEFAULT_TICK_INTERVAL_MS;
  let lastAdvancedAtMs = recovery?.lastAdvancedAtMs ?? options.startedAtMs ?? clock();
  const firstEventDelayMs = recovery?.firstEventDelayMs ?? options.firstEventDelayMs ?? FIRST_EVENT_DELAY_MS;
  const eventIntervalMs = recovery?.eventIntervalMs ?? options.eventIntervalMs ?? EVENT_CADENCE_MS;
  let nextEventAtMs = recovery?.nextEventAtMs ?? lastAdvancedAtMs + firstEventDelayMs;
  let eventCount = recovery?.eventCount ?? 0;
  const appliedInformationIds = new Set(recovery?.appliedInformationIds ?? recovery?.appliedEventIds ?? []);
  let cancelScheduledTick: (() => void) | undefined;
  const listeners = new Set<MarketSnapshotListener>();
  const playerPressure = createPlayerPressureBook(recovery?.playerPressure);

  function snapshot(): MarketSnapshot {
    return toMarketSnapshot(state, lastAdvancedAtMs, currentMarketReads(lastAdvancedAtMs));
  }

  function currentMarketReads(nowMs: number): MarketReadByAsset {
    return Object.fromEntries(state.assets.map((asset) => {
      const eventEffect = combinedEventEffect(state.activeEvents, asset, nowMs);
      return [
        asset.id,
        calculateMarketRead(asset, {
          simulated: calculateSimulatedInvestorPressure(asset, eventEffect),
          player: playerPressure.pressureForAsset(asset.id, nowMs)
        }, eventEffect)
      ];
    }));
  }

  function advanceTo(
    nowMs: number,
    pressureByAsset: PressureByAsset = NO_PRESSURE
  ): MarketSnapshot {
    if (!Number.isFinite(nowMs)) {
      throw new RangeError("Market time must be a finite millisecond timestamp.");
    }

    if (nowMs < lastAdvancedAtMs) {
      return snapshot();
    }

    function applyConsequences(event: MarketEvent): void {
      if (event.consequenceVersion !== 1 || appliedInformationIds.has(event.id)) return;
      state = applyStockEventConsequences(state, event);
      appliedInformationIds.add(event.id);
    }

    function applyLegacyConsequences(upToMs: number): void {
      for (const event of [...state.activeEvents]
        .filter((event) => event.publishedAt <= upToMs)
        .sort((left, right) => left.publishedAt - right.publishedAt || left.id.localeCompare(right.id))) {
        applyConsequences(event);
      }
    }

    function nextPendingUpdate(): { storyId: string; updateId: string; publishedAt: number } | null {
      const pending = state.stories.flatMap((story) => story.updates
        .filter((update) => update.state === "pending")
        .map((update) => ({ storyId: story.id, updateId: update.id, publishedAt: update.publishedAt }))
      ).sort((left, right) => left.publishedAt - right.publishedAt || left.updateId.localeCompare(right.updateId));
      return pending[0] ?? null;
    }

    function publishUpdate(storyId: string, updateId: string): void {
      const story = state.stories.find((candidate) => candidate.id === storyId);
      const update = story?.updates.find((candidate) => candidate.id === updateId);
      if (!story || !update || update.state !== "pending") return;
      const publication = publishMarketStoryUpdate(story, update, state.assets);
      const updates = story.updates.map((candidate) => candidate.id === updateId ? publication.update : candidate);
      const publishedStory = {
        ...story,
        updates,
        status: updates.every((candidate) => candidate.state === "published") ? "resolved" as const : "developing" as const
      };
      state = {
        ...state,
        activeEvents: [...state.activeEvents, publication.event],
        stories: state.stories.map((candidate) => candidate.id === storyId ? publishedStory : candidate)
      };
      applyConsequences(publication.event);
    }

    function createDueStory(): void {
      eventCount += 1;
      const story = createMarketStory({
        id: `story-${eventCount}`,
        publishedAt: nextEventAtMs,
        rng,
        assets: state.assets
      });
      state = { ...state, stories: [...state.stories, story] };
      nextEventAtMs += eventIntervalMs;
    }

    applyLegacyConsequences(nowMs);
    while (true) {
      const pending = nextPendingUpdate();
      const pendingAtMs = pending?.publishedAt ?? Number.POSITIVE_INFINITY;
      const generatedAtMs = nextEventAtMs;
      const nextAtMs = Math.min(pendingAtMs, generatedAtMs);
      if (nextAtMs > nowMs) break;
      if (pending && pendingAtMs <= generatedAtMs) {
        publishUpdate(pending.storyId, pending.updateId);
      } else {
        createDueStory();
      }
    }

    if (nowMs === lastAdvancedAtMs) return snapshot();

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
    const applied = [...appliedInformationIds];
    return {
      marketState: state,
      rngState: rng.state(),
      lastAdvancedAtMs,
      nextEventAtMs,
      eventCount,
      tickIntervalMs,
      firstEventDelayMs,
      eventIntervalMs,
      playerPressure: playerPressure.recoveryState(),
      appliedInformationIds: applied,
      appliedEventIds: applied
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
