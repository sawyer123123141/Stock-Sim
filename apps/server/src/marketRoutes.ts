import type { FastifyInstance } from "fastify";
import type { MarketSnapshot } from "../../../packages/shared/src/index.js";
import type { MarketRuntime } from "./marketRuntime.js";

// Fictional in-game economy only. These routes expose simulated game state.
export interface MarketRouteOptions {
  runtime: MarketRuntime;
}

export function registerMarketRoutes(
  app: FastifyInstance,
  options: MarketRouteOptions
): void {
  app.get("/api/market", async () => options.runtime.snapshot());

  app.get("/ws/market", { websocket: true }, (socket) => {
    const sendSnapshot = (snapshot: MarketSnapshot): void => {
      if (socket.readyState === 1) {
        socket.send(JSON.stringify(snapshot));
      }
    };

    sendSnapshot(options.runtime.snapshot());
    const unsubscribe = options.runtime.subscribe(sendSnapshot);
    const cleanup = (): void => {
      unsubscribe();
    };

    socket.once("close", cleanup);
    socket.once("error", cleanup);
  });
}
