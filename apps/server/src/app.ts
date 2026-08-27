import websocket from "@fastify/websocket";
import Fastify, { type FastifyInstance } from "fastify";
import { registerMarketRoutes } from "./marketRoutes.js";
import type { MarketRuntime } from "./marketRuntime.js";

export interface BuildMarketAppOptions {
  runtime: MarketRuntime;
}

export function buildMarketApp(options: BuildMarketAppOptions): FastifyInstance {
  const app = Fastify({ logger: false });

  // Register websocket support before any routes so upgrades are intercepted correctly.
  app.register(websocket);
  registerMarketRoutes(app, { runtime: options.runtime });

  return app;
}
