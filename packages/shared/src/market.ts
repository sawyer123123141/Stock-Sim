export type AssetKind = "stock" | "crypto";
export type Direction = "up" | "down";
export type MarketRisk = "low" | "medium" | "high";
export type MarketPressureOutlook =
  | "down"
  | "slightly-down"
  | "balanced"
  | "slightly-up"
  | "up";
export type ReasonCode =
  | "company"
  | "sector"
  | "sentiment"
  | "momentum"
  | "demand"
  | "news"
  | "noise";

export interface MovementReason {
  code: ReasonCode;
  label: string;
  direction: Direction;
  weight: number;
  summary: string;
}

/**
 * Persistent stock-company qualities, normalized from -1 (extremely weak) to
 * 1 (extremely strong). These are server-only simulation state for now.
 */
export interface StockFundamentals {
  growth: number;
  profitability: number;
  financialHealth: number;
  competitivePosition: number;
  reputation: number;
}

/**
 * The market's current normalized expectations for a stock, separate from its
 * underlying fundamentals. These are server-only simulation state for now.
 */
export interface MarketExpectations {
  growth: number;
  profitability: number;
  demand: number;
  execution: number;
}

export interface AssetState {
  id: string;
  symbol: string;
  name: string;
  kind: AssetKind;
  sector: string;
  price: number;
  lastTickChangePct: number;
  baselineVolatility: number;
  sentiment: number;
  momentum: number;
  sectorTrend: number;
  companyStrength?: number;
  fundamentals?: StockFundamentals;
  expectations?: MarketExpectations;
  reasons: MovementReason[];
}

export interface MarketEventTarget {
  kind: "asset" | "sector" | "global";
  value?: string;
}

export interface MarketEvent {
  id: string;
  title: string;
  summary: string;
  effect: number;
  publishedAt: number;
  reactionStartsAt: number;
  expiresAt: number;
  target: MarketEventTarget;
}

export interface MarketPressure {
  simulated: number;
  player: number;
}

export interface MarketState {
  sequence: number;
  assets: AssetState[];
  activeEvents: MarketEvent[];
}

export interface AssetSnapshot {
  id: string;
  symbol: string;
  name: string;
  kind: AssetKind;
  sector: string;
  price: number;
  lastTickChangePct: number;
  marketRead: MarketReadSnapshot;
  reasons: MovementReason[];
}

export interface MarketReadSnapshot {
  risk: MarketRisk;
  pressure: MarketPressureOutlook;
}

export interface MarketEventSnapshot {
  id: string;
  title: string;
  summary: string;
  target: MarketEventTarget;
  publishedAt: string;
  reactionStartsAt: string;
  expiresAt: string;
}

export interface MarketSnapshot {
  sequence: number;
  generatedAt: string;
  assets: AssetSnapshot[];
  events: MarketEventSnapshot[];
}

export interface MovementContribution {
  code: ReasonCode;
  label: string;
  value: number;
  summaryUp: string;
  summaryDown: string;
}

export interface TickContext {
  demand: MarketPressure;
  eventEffect: number;
  deltaMs: number;
}

export interface AssetTickResult {
  asset: AssetState;
  contributions: MovementContribution[];
  returnFraction: number;
}
