import Fastify, { type FastifyInstance } from "fastify";
import { registerMarketRoutes } from "./marketRoutes.js";
import type { MarketRuntime } from "./marketRuntime.js";

export interface BuildMarketAppOptions {
  runtime: MarketRuntime;
}

export function buildMarketApp(options: BuildMarketAppOptions): FastifyInstance {
  const app = Fastify({ logger: false });
  registerMarketRoutes(app, { runtime: options.runtime });
  return app;
}
