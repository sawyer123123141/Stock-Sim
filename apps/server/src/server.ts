import type { FastifyInstance, FastifyListenOptions } from "fastify";
import { buildMarketApp } from "./app.js";
import { createMarketRuntime, type MarketRuntime } from "./marketRuntime.js";
import { InMemoryPortfolioStore, type PortfolioStore } from "./portfolioStore.js";
import { createTradingService, type TradingService } from "./tradingService.js";

export interface MarketServerOptions {
  runtime?: MarketRuntime;
  store?: PortfolioStore;
  trading?: TradingService;
  playerId?: string;
}

export interface MarketServer {
  app: FastifyInstance;
  runtime: MarketRuntime;
  trading: TradingService;
  listen(options: FastifyListenOptions): Promise<string>;
  close(): Promise<void>;
}

export function createMarketServer(options: MarketServerOptions = {}): MarketServer {
  const runtime = options.runtime ?? createMarketRuntime();
  const store = options.store ?? new InMemoryPortfolioStore();
  const trading = options.trading ?? createTradingService({ runtime, store });
  const playerId = options.playerId ?? "demo-player";
  const app = buildMarketApp({ runtime, trading, playerId });
  let runtimeStarted = false;

  async function listen(listenOptions: FastifyListenOptions): Promise<string> {
    if (!runtimeStarted) {
      runtime.start();
      runtimeStarted = true;
    }

    try {
      return await app.listen(listenOptions);
    } catch (error) {
      runtime.stop();
      runtimeStarted = false;
      throw error;
    }
  }

  async function close(): Promise<void> {
    if (runtimeStarted) {
      runtime.stop();
      runtimeStarted = false;
    }
    await app.close();
  }

  return { app, runtime, trading, listen, close };
}
