import type { FastifyInstance } from "fastify";
import type { TradeIntent, TradingErrorResponse } from "../../../packages/shared/src/index.js";
import { TradingError, type TradingService } from "./tradingService.js";

export interface TradingRouteOptions {
  trading: TradingService;
  playerId: string;
}

export function registerTradingRoutes(
  app: FastifyInstance,
  options: TradingRouteOptions
): void {
  app.get("/api/portfolio", async () => options.trading.getPortfolio(options.playerId));

  app.post("/api/trades", async (request, reply) => {
    try {
      return await options.trading.executeTrade(options.playerId, request.body as TradeIntent);
    } catch (error) {
      if (!(error instanceof TradingError)) throw error;

      const statusCode = error.code === "ASSET_NOT_FOUND"
        ? 404
        : error.code === "INVALID_TRADE"
          ? 400
          : 409;
      const body: TradingErrorResponse = { error: error.code, message: error.message };
      return reply.code(statusCode).send(body);
    }
  });
}
