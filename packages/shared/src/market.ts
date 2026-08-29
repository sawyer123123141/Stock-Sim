export type AssetKind = "stock" | "crypto";
export type Direction = "up" | "down";
export type MarketRisk = "low" | "medium" | "high";
export type MarketMovement = "calm" | "active" | "elevated";
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
  | "relationship"
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

/**
 * The portion of current market expectations already absorbed into stock
 * pricing behavior. This remains server-only simulation state.
 */
export interface StockPricingState {
  pricedExpectations: MarketExpectations;
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
  pricingState?: StockPricingState;
  reasons: MovementReason[];
}

export interface MarketEventTarget {
  kind: "asset" | "sector" | "global";
  value?: string;
}

/** Balance classification for internal event importance, never a fixed return tier. */
export type EventSignificance = "minor" | "normal" | "major" | "transformative";

/**
 * A sparse report of business information revealed by a stock event. Values
 * are normalized from -1 (materially weaker) through 0 (neutral/mixed) to 1
 * (materially stronger); they describe a reported outcome, not a new
 * fundamental.
 */
export interface StockEventOutcome {
  growth?: number;
  profitability?: number;
  demand?: number;
  execution?: number;
  financialHealth?: number;
  competitivePosition?: number;
  reputation?: number;
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
  outcome?: StockEventOutcome;
  expectedOutcome?: StockEventOutcome;
  surprise?: number;
  significance?: EventSignificance;
  /**
   * Sparse, normalized deltas to persistent company reality. This remains
   * server-only and is intentionally separate from the reported outcome.
   */
  fundamentalImpact?: Partial<StockFundamentals>;
  /** Internal compatibility marker for event consequence semantics. */
  consequenceVersion?: 1;
  /** Server-only origin metadata for a bounded connected-company reaction. */
  relationship?: {
    sourceAssetId: string;
    sourceEventId: string;
    kind: CompanyRelationshipKind;
  };
}

export type CompanyRelationshipKind = "supplier" | "customer" | "competitor" | "partner";
export type CompanyRelationshipImportance = "limited" | "meaningful" | "important";

/** Static server-owned relationship direction: public information flows from `from` to `to`. */
export interface CompanyRelationship {
  id: string;
  fromAssetId: string;
  toAssetId: string;
  kind: CompanyRelationshipKind;
  influence: CompanyRelationshipImportance;
}

export type MarketStoryStatus = "developing" | "resolved";
export type MarketStoryUpdateState = "pending" | "published";

/**
 * Server-only planned or published information within a market story. Pending
 * updates may contain future truth, but their compatibility reaction is only
 * resolved when the runtime publishes them.
 */
export interface MarketStoryUpdate {
  id: string;
  title: string;
  summary: string;
  publishedAt: number;
  state: MarketStoryUpdateState;
  outcome?: StockEventOutcome;
  expectedOutcome?: StockEventOutcome;
  surprise?: number;
  effect?: number;
  /** Private direct-reaction input for numeric-only legacy-compatible events. */
  effectHint?: number;
  significance?: EventSignificance;
  fundamentalImpact?: Partial<StockFundamentals>;
  reactsQuickly?: boolean;
  /** Published-only public targets that actually received a relationship spillover. */
  relatedAssetIds?: string[];
}

/** Server-only deterministic plan and published history for related updates. */
export interface MarketStory {
  id: string;
  title: string;
  target: MarketEventTarget;
  status: MarketStoryStatus;
  updates: MarketStoryUpdate[];
}

export interface MarketPressure {
  simulated: number;
  player: number;
}

export interface MarketState {
  sequence: number;
  assets: AssetState[];
  activeEvents: MarketEvent[];
  stories: MarketStory[];
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
  research?: StockResearchSnapshot;
  relationships?: CompanyRelationshipSnapshot[];
  reasons: MovementReasonSnapshot[];
}

/** Safe public summary of a known company connection. */
export interface CompanyRelationshipSnapshot {
  assetId: string;
  name: string;
  symbol: string;
  kind: CompanyRelationshipKind;
  importance: CompanyRelationshipImportance;
}

export interface MarketReadSnapshot {
  movement: MarketMovement;
  pressure: MarketPressureOutlook;
}

export type CompanyResearchLevel = "challenged" | "mixed" | "solid" | "strong";
export type ExpectationResearchLevel = "cautious" | "balanced" | "constructive" | "high";
export type MovementReasonStrength = "small" | "moderate" | "strong";

export interface StockResearchSnapshot {
  company: Record<keyof StockFundamentals, CompanyResearchLevel>;
  expectations: Record<keyof MarketExpectations, ExpectationResearchLevel>;
}

export interface MovementReasonSnapshot {
  code: ReasonCode;
  label: string;
  direction: Direction;
  strength: MovementReasonStrength;
  summary: string;
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

export interface MarketStoryUpdateSnapshot {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  /** Already-public connected companies affected by this exact update. */
  relatedAssetIds?: string[];
}

export interface MarketStorySnapshot {
  id: string;
  title: string;
  target: MarketEventTarget;
  status: MarketStoryStatus;
  updates: MarketStoryUpdateSnapshot[];
}

export interface MarketSnapshot {
  sequence: number;
  generatedAt: string;
  assets: AssetSnapshot[];
  events: MarketEventSnapshot[];
  stories: MarketStorySnapshot[];
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
  relationshipEffect?: number;
  relationshipSourceName?: string;
  deltaMs: number;
}

export interface AssetTickResult {
  asset: AssetState;
  contributions: MovementContribution[];
  returnFraction: number;
}
