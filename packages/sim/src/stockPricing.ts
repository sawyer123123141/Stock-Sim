import type { MarketExpectations, StockPricingState } from "../../shared/src/index.js";
import { clamp } from "./math.js";

const EXPECTATION_DIMENSIONS = ["growth", "profitability", "demand", "execution"] as const;
export const PRICED_EXPECTATION_HALF_LIFE_MS = 120_000;

function normalized(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? clamp(value, -1, 1) : fallback;
}

export function normalizeStockPricingState(
  value: Partial<StockPricingState> | undefined,
  expectations: MarketExpectations
): StockPricingState {
  const candidate = value?.pricedExpectations;
  return {
    pricedExpectations: {
      growth: normalized(candidate?.growth, expectations.growth),
      profitability: normalized(candidate?.profitability, expectations.profitability),
      demand: normalized(candidate?.demand, expectations.demand),
      execution: normalized(candidate?.execution, expectations.execution)
    }
  };
}

/** Moves already-priced beliefs toward current beliefs using a game-time half-life. */
export function absorbStockPricingState(
  pricingState: StockPricingState,
  expectations: MarketExpectations,
  deltaMs: number
): StockPricingState {
  const elapsedMs = Math.max(0, deltaMs);
  const absorption = 1 - Math.pow(0.5, elapsedMs / PRICED_EXPECTATION_HALF_LIFE_MS);
  const pricedExpectations = { ...pricingState.pricedExpectations };
  for (const dimension of EXPECTATION_DIMENSIONS) {
    pricedExpectations[dimension] = clamp(
      pricedExpectations[dimension]
        + (expectations[dimension] - pricedExpectations[dimension]) * absorption,
      -1,
      1
    );
  }
  return { pricedExpectations };
}
