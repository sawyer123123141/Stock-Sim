import type { MarketSnapshot, PortfolioSnapshot, TradeExecutionResponse, TradeIntent } from "../../../packages/shared/src/index.js";
import { createSeedMarket } from "../../../packages/sim/src/index.js";
import { createMarketRuntime, type MarketRuntimeRecoveryState } from "./marketRuntime.js";
import { InMemoryPortfolioStore, type PortfolioState } from "./portfolioStore.js";
import { createTradingService } from "./tradingService.js";

const DEMO_PLAYER_ID = "demo-player";

export interface PersistedGameState {
  runtime: MarketRuntimeRecoveryState;
  portfolio: PortfolioState;
  nextTradeId: number;
}

export interface LockedGameStore {
  transact<T>(mutation: (state: PersistedGameState) => Promise<T>): Promise<T>;
}

export function createInitialGameState(startedAtMs: number): PersistedGameState {
  const runtime = createMarketRuntime({ initialState: createSeedMarket(), startedAtMs });
  return {
    runtime: runtime.recoveryState(),
    portfolio: { playerId: DEMO_PLAYER_ID, cashCents: 1_000_000, positions: {} },
    nextTradeId: 1
  };
}

export interface PersistentGameAuthority {
  getMarket(): Promise<MarketSnapshot>;
  getPortfolio(): Promise<PortfolioSnapshot>;
  executeTrade(intent: TradeIntent): Promise<TradeExecutionResponse>;
}

export function createPersistentGameAuthority(
  store: LockedGameStore,
  now: () => number = () => Date.now()
): PersistentGameAuthority {
  async function withRuntime<T>(mutation: (runtime: ReturnType<typeof createMarketRuntime>, state: PersistedGameState, atMs: number) => Promise<T>): Promise<T> {
    return store.transact(async (state) => {
      const atMs = now();
      const runtime = createMarketRuntime({ recoveryState: state.runtime });
      const start = state.runtime.lastAdvancedAtMs;
      if (!Number.isFinite(atMs) || atMs < start) throw new RangeError("Market time must not move backward.");
      const tickIntervalMs = state.runtime.tickIntervalMs;
      if (!Number.isFinite(tickIntervalMs) || tickIntervalMs <= 0) {
        throw new RangeError("Persisted market tick interval must be positive.");
      }
      for (let stepAtMs = start + tickIntervalMs; stepAtMs <= atMs; stepAtMs += tickIntervalMs) {
        runtime.advanceTo(stepAtMs);
      }
      const result = await mutation(runtime, state, atMs);
      state.runtime = runtime.recoveryState();
      return result;
    });
  }

  return {
    getMarket: () => withRuntime(async (runtime) => runtime.snapshot()),
    getPortfolio: () => withRuntime(async (runtime, state) => {
      const service = createTradingService({
        runtime,
        store: new InMemoryPortfolioStore(0, state.portfolio),
        nextTradeId: state.nextTradeId
      });
      return service.getPortfolio(DEMO_PLAYER_ID);
    }),
    executeTrade: (intent) => withRuntime(async (runtime, state, atMs) => {
      const portfolioStore = new InMemoryPortfolioStore(0, state.portfolio);
      const service = createTradingService({
        runtime,
        store: portfolioStore,
        now: () => atMs,
        nextTradeId: state.nextTradeId
      });
      const result = await service.executeTrade(DEMO_PLAYER_ID, intent);
      state.portfolio = await portfolioStore.read(DEMO_PLAYER_ID);
      state.nextTradeId += 1;
      return result;
    })
  };
}
