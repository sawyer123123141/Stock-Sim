import type { AssetState } from "../../shared/src/index.js";
import { clamp } from "./math.js";

const MAX_SIMULATED_PRESSURE = 0.65;

function signal(value: number): number {
  return Math.tanh(clamp(value, -1, 1));
}

/**
 * Aggregates deterministic investor groups into one market-pressure signal.
 * Stocks weigh fundamentals alongside momentum and news; crypto is more
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

  const fundamental = signal(
    ((asset.companyStrength ?? 0.25) - 0.25) * 0.55
    + asset.sectorTrend * 0.45
    + news * 0.45
    + asset.sentiment * 0.15
  ) * 0.42;
  const momentum = signal(asset.momentum) * 0.18 + clamp(asset.sentiment, -1, 1) * 0.08;
  return clamp(fundamental + momentum, -MAX_SIMULATED_PRESSURE, MAX_SIMULATED_PRESSURE);
}
