import type { IncomingMessage, ServerResponse } from "node:http";
import type { TradeIntent } from "../packages/shared/src/index.js";
import { TradingError } from "../apps/server/src/tradingService.js";
import { hostedAuthority } from "./_authority.js";

async function readBody(request: IncomingMessage): Promise<unknown> {
  let raw = "";
  for await (const chunk of request) raw += String(chunk);
  return JSON.parse(raw);
}

export default async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (request.method !== "POST") { response.statusCode = 405; response.end(); return; }
  response.setHeader("content-type", "application/json");
  try {
    response.end(JSON.stringify(await hostedAuthority().executeTrade(await readBody(request) as TradeIntent)));
  } catch (error) {
    if (!(error instanceof TradingError)) throw error;
    response.statusCode = error.code === "ASSET_NOT_FOUND" ? 404 : error.code === "INVALID_TRADE" ? 400 : 409;
    response.end(JSON.stringify({ error: error.code, message: error.message }));
  }
}
