import websocket from "@fastify/websocket";
import Fastify, { type FastifyInstance } from "fastify";
import { registerMarketRoutes } from "./marketRoutes.js";
import type { MarketRuntime } from "./marketRuntime.js";

export interface BuildMarketAppOptions {
  runtime: MarketRuntime;
}

export function buildMarketApp(options: BuildMarketAppOptions): FastifyInstance {
  const app = Fastify({ logger: false });

  // WebSocket support must initialize before routes are declared so its onRoute hook
  // can transform websocket routes before Fastify finalizes them.
  app.register(websocket);
  app.register(async (routeScope) => {
    registerMarketRoutes(routeScope, { runtime: options.runtime });
  });

  return app;
}
