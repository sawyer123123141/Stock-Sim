import websocket from "@fastify/websocket";
import Fastify, { type FastifyInstance } from "fastify";
import { registerMarketRoutes } from "./marketRoutes.js";
import type { MarketRuntime } from "./marketRuntime.js";
import { InMemoryPortfolioStore } from "./portfolioStore.js";
import { registerResearchRoutes } from "./researchRoutes.js";
import { createResearchService, type ResearchService } from "./researchService.js";
import { registerTradingRoutes } from "./tradingRoutes.js";
import { createTradingService, type TradingService } from "./tradingService.js";

export interface BuildMarketAppOptions {
  runtime: MarketRuntime;
  trading?: TradingService;
  research?: ResearchService;
  playerId?: string;
}

export function buildMarketApp(options: BuildMarketAppOptions): FastifyInstance {
  const app = Fastify({ logger: false });
  const store = new InMemoryPortfolioStore();
  const trading = options.trading ?? createTradingService({
    runtime: options.runtime,
    store
  });
  const research = options.research ?? createResearchService({ runtime: options.runtime, store });
  const playerId = options.playerId ?? "demo-player";

  // WebSocket support must initialize before routes are declared so its onRoute hook
  // can transform websocket routes before Fastify finalizes them.
  app.register(websocket);
  app.register(async (routeScope) => {
    registerMarketRoutes(routeScope, { runtime: options.runtime });
    registerTradingRoutes(routeScope, { trading, playerId });
    registerResearchRoutes(routeScope, { research, playerId });
  });

  return app;
}
