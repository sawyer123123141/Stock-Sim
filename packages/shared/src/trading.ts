import type { AssetKind } from "./market.js";

export type TradeSide = "buy" | "sell";

export interface TradeIntent {
  assetId: string;
  side: TradeSide;
  quantity: number;
}

export interface TradeFill {
  id: string;
  assetId: string;
  symbol: string;
  side: TradeSide;
  quantity: number;
  unitPrice: number;
  total: number;
  executedAt: string;
}

export interface PortfolioPositionSnapshot {
  assetId: string;
  symbol: string;
  name: string;
  kind: AssetKind;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnL: number;
}

export interface PortfolioSnapshot {
  cash: number;
  marketValue: number;
  totalValue: number;
  positions: PortfolioPositionSnapshot[];
}

export interface TradeExecutionResponse {
  fill: TradeFill;
  portfolio: PortfolioSnapshot;
}

export type TradingErrorCode =
  | "INVALID_TRADE"
  | "ASSET_NOT_FOUND"
  | "INSUFFICIENT_CASH"
  | "INSUFFICIENT_HOLDINGS";

export interface TradingErrorResponse {
  error: TradingErrorCode;
  message: string;
}
