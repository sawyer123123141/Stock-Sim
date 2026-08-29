import type { AssetState } from "../../shared/src/index.js";
import { clamp } from "./math.js";

const MAX_SIMULATED_PRESSURE = 0.65;

function signal(value: number): number {
  return Math.tanh(clamp(value, -1, 1));
}

export interface StockInvestorInterpretation {
  value: number;
  momentum: number;
  cautious: number;
  repricingPressure: number;
  aggregate: number;
}

function expectationGap(asset: AssetState, dimension: "growth" | "profitability" | "demand" | "execution"): number {
  const expected = asset.expectations?.[dimension] ?? 0;
  const priced = asset.pricingState?.pricedExpectations[dimension] ?? expected;
  return clamp(expected - priced, -1, 1);
}

/**
 * Deterministic aggregate stock-investor interpretations. They deliberately
 * read public beliefs and market behavior, never hidden company reality.
 */
export function calculateStockInvestorInterpretation(
  asset: AssetState,
  eventEffect: number
): StockInvestorInterpretation {
  const news = clamp(eventEffect, -1, 1);
  const growthGap = expectationGap(asset, "growth");
  const profitabilityGap = expectationGap(asset, "profitability");
  const demandGap = expectationGap(asset, "demand");
  const executionGap = expectationGap(asset, "execution");

  const valueRepricing = signal(
    growthGap * 0.85 + profitabilityGap * 0.75 + demandGap * 0.2
  ) * 0.32;
  const cautiousRepricing = signal(
    profitabilityGap * 0.58 + executionGap * 0.72
  ) * 0.28;
  const value = clamp(valueRepricing + signal(asset.sectorTrend * 0.2) * 0.08, -0.4, 0.4);
  const momentum = signal(
    asset.momentum * 1
    + news * 0.75
    + asset.sentiment * 0.45
    + asset.sectorTrend * 0.2
  ) * 0.24;
  const cautious = clamp(
    cautiousRepricing + signal(news * 0.25 + asset.sectorTrend * 0.35) * 0.1,
    -0.38,
    0.38
  );
  return {
    value,
    momentum,
    cautious,
    repricingPressure: clamp(valueRepricing + cautiousRepricing, -0.6, 0.6),
    aggregate: clamp(value + momentum + cautious, -MAX_SIMULATED_PRESSURE, MAX_SIMULATED_PRESSURE)
  };
}

/**
 * Aggregates deterministic investor groups into one market-pressure signal.
 * Stocks interpret public expectations and market behavior; crypto is more
 * responsive to trend, sentiment, and speculative attention.
 */
export function calculateSimulatedInvestorPressure(
  asset: AssetState,
  eventEffect: number
): number {
  const news = clamp(eventEffect, -1, 1);

  if (asset.kind === "crypto") {
    const speculative = signal(
      asset.momentum * 1.25
      + asset.sentiment * 0.9
      + news * 0.85
      + asset.sectorTrend * 0.35
    ) * 0.52;
    const momentum = signal(asset.momentum * 0.65 + asset.sentiment * 0.3) * 0.14;
    return clamp(speculative + momentum, -MAX_SIMULATED_PRESSURE, MAX_SIMULATED_PRESSURE);
  }

  return calculateStockInvestorInterpretation(asset, news).aggregate;
}
