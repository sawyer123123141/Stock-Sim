import type {
  AssetState,
  MarketPressure,
  MarketPressureOutlook,
  MarketMovement,
  MarketReadSnapshot,
  MarketRisk
} from "../../shared/src/index.js";
import { calculateDemandPressure } from "./demand.js";

const LOW_RISK_MAX_VOLATILITY = 0.33;
const MEDIUM_RISK_MAX_VOLATILITY = 0.65;
const BALANCED_PRESSURE_MAX = 0.075;
const OUTER_PRESSURE_MIN = 0.3;

export function classifyMarketRisk(asset: AssetState): MarketRisk {
  if (asset.baselineVolatility < LOW_RISK_MAX_VOLATILITY) return "low";
  if (asset.baselineVolatility < MEDIUM_RISK_MAX_VOLATILITY) return "medium";
  return "high";
}

export function classifyMarketMovement(asset: AssetState): MarketMovement {
  if (asset.baselineVolatility < LOW_RISK_MAX_VOLATILITY) return "calm";
  if (asset.baselineVolatility < MEDIUM_RISK_MAX_VOLATILITY) return "active";
  return "elevated";
}

export function classifyMarketPressure(pressure: number): MarketPressureOutlook {
  if (pressure <= -OUTER_PRESSURE_MIN) return "down";
  if (pressure < -BALANCED_PRESSURE_MAX) return "slightly-down";
  if (pressure <= BALANCED_PRESSURE_MAX) return "balanced";
  if (pressure < OUTER_PRESSURE_MIN) return "slightly-up";
  return "up";
}

export function calculateMarketRead(
  asset: AssetState,
  pressure: MarketPressure
): MarketReadSnapshot {
  return {
    movement: classifyMarketMovement(asset),
    pressure: classifyMarketPressure(calculateDemandPressure(pressure))
  };
}
