export type AssetKind = "stock" | "crypto";
export type Direction = "up" | "down";
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
  reasons: MovementReason[];
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
