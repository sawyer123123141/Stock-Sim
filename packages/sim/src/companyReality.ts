import type {
  AssetState,
  MarketExpectations,
  MarketState,
  StockFundamentals,
  StockPricingState
} from "../../shared/src/index.js";
import { normalizeStockPricingState } from "./stockPricing.js";

export interface StockCompanyProfile {
  fundamentals: StockFundamentals;
  expectations: MarketExpectations;
}

const NEUTRAL_FUNDAMENTALS: StockFundamentals = {
  growth: 0,
  profitability: 0,
  financialHealth: 0,
  competitivePosition: 0,
  reputation: 0
};

const NEUTRAL_EXPECTATIONS: MarketExpectations = {
  growth: 0,
  profitability: 0,
  demand: 0,
  execution: 0
};

export const STOCK_COMPANY_PROFILES: Readonly<Record<string, StockCompanyProfile>> = {
  nova: {
    fundamentals: { growth: 0.55, profitability: 0.2, financialHealth: 0.3, competitivePosition: 0.45, reputation: 0.5 },
    expectations: { growth: 0.5, profitability: 0.2, demand: 0.75, execution: 0.4 }
  },
  luma: {
    fundamentals: { growth: 0.8, profitability: -0.15, financialHealth: 0.15, competitivePosition: 0.7, reputation: 0.65 },
    expectations: { growth: 0.75, profitability: 0.2, demand: 0.7, execution: 0.65 }
  },
  hgrid: {
    fundamentals: { growth: 0.15, profitability: 0.45, financialHealth: 0.55, competitivePosition: 0.25, reputation: 0.35 },
    expectations: { growth: 0.1, profitability: 0.3, demand: 0.1, execution: 0.2 }
  }
};

function normalizedDimension(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(-1, Math.min(1, value));
}

function normalizeFundamentals(
  value: Partial<StockFundamentals> | undefined,
  fallback: StockFundamentals
): StockFundamentals {
  const candidate = value && typeof value === "object" ? value : {};
  return {
    growth: normalizedDimension(candidate.growth, fallback.growth),
    profitability: normalizedDimension(candidate.profitability, fallback.profitability),
    financialHealth: normalizedDimension(candidate.financialHealth, fallback.financialHealth),
    competitivePosition: normalizedDimension(candidate.competitivePosition, fallback.competitivePosition),
    reputation: normalizedDimension(candidate.reputation, fallback.reputation)
  };
}

function normalizeExpectations(
  value: Partial<MarketExpectations> | undefined,
  fallback: MarketExpectations
): MarketExpectations {
  const candidate = value && typeof value === "object" ? value : {};
  return {
    growth: normalizedDimension(candidate.growth, fallback.growth),
    profitability: normalizedDimension(candidate.profitability, fallback.profitability),
    demand: normalizedDimension(candidate.demand, fallback.demand),
    execution: normalizedDimension(candidate.execution, fallback.execution)
  };
}

function sameFundamentals(left: StockFundamentals | undefined, right: StockFundamentals): boolean {
  return left?.growth === right.growth
    && left.profitability === right.profitability
    && left.financialHealth === right.financialHealth
    && left.competitivePosition === right.competitivePosition
    && left.reputation === right.reputation;
}

function sameExpectations(left: MarketExpectations | undefined, right: MarketExpectations): boolean {
  return left?.growth === right.growth
    && left.profitability === right.profitability
    && left.demand === right.demand
    && left.execution === right.execution;
}

function samePricingState(left: StockPricingState | undefined, right: StockPricingState): boolean {
  return left?.pricedExpectations.growth === right.pricedExpectations.growth
    && left.pricedExpectations.profitability === right.pricedExpectations.profitability
    && left.pricedExpectations.demand === right.pricedExpectations.demand
    && left.pricedExpectations.execution === right.pricedExpectations.execution;
}

function profileFor(assetId: string): StockCompanyProfile {
  return STOCK_COMPANY_PROFILES[assetId] ?? {
    fundamentals: NEUTRAL_FUNDAMENTALS,
    expectations: NEUTRAL_EXPECTATIONS
  };
}

function normalizeStockCompanyReality(asset: AssetState): AssetState {
  if (asset.kind !== "stock") return asset;

  const profile = profileFor(asset.id);
  const fundamentals = normalizeFundamentals(asset.fundamentals, profile.fundamentals);
  const expectations = normalizeExpectations(asset.expectations, profile.expectations);
  const pricingState = normalizeStockPricingState(asset.pricingState, expectations);
  if (
    sameFundamentals(asset.fundamentals, fundamentals)
    && sameExpectations(asset.expectations, expectations)
    && samePricingState(asset.pricingState, pricingState)
  ) {
    return asset;
  }
  return { ...asset, fundamentals, expectations, pricingState };
}

/**
 * Adds or safely normalizes stock-only internal company state at the runtime
 * boundary. It is deliberately pure and does not touch simulation clocks,
 * RNG, prices, events, or player pressure.
 */
export function hydrateMarketCompanyReality(state: MarketState): MarketState {
  let changed = false;
  const assets = state.assets.map((asset) => {
    const normalized = normalizeStockCompanyReality(asset);
    changed ||= normalized !== asset;
    return normalized;
  });
  return changed ? { ...state, assets } : state;
}
