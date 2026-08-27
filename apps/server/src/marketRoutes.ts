import type { FastifyInstance } from "fastify";
import type { MarketRuntime } from "./marketRuntime.js";

// Fictional in-game economy only. This endpoint exposes simulated game state.
export interface MarketRouteOptions {
  runtime: MarketRuntime;
}

export function registerMarketRoutes(
  app: FastifyInstance,
  options: MarketRouteOptions
): void {
  app.get("/api/market", async () => options.runtime.snapshot());
}
