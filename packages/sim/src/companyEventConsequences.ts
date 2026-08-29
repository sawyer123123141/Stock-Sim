import type {
  AssetState,
  EventSignificance,
  MarketEvent,
  MarketExpectations,
  MarketState,
  StockFundamentals
} from "../../shared/src/index.js";
import { clamp } from "./math.js";

const FUNDAMENTAL_DIMENSIONS = [
  "growth",
  "profitability",
  "financialHealth",
  "competitivePosition",
  "reputation"
] as const;
const EXPECTATION_DIMENSIONS = ["growth", "profitability", "demand", "execution"] as const;

const FUNDAMENTAL_IMPACT_SCALE: Readonly<Record<EventSignificance, number>> = {
  minor: 0.25,
  normal: 0.5,
  major: 0.75,
  transformative: 1
};
const EXPECTATION_UPDATE_SCALE: Readonly<Record<EventSignificance, number>> = {
  minor: 0.12,
  normal: 0.2,
  major: 0.3,
  transformative: 0.4
};

function matchesStock(event: MarketEvent, asset: AssetState): boolean {
  if (asset.kind !== "stock") return false;
  return (event.target.kind === "asset" && event.target.value === asset.id)
    || (event.target.kind === "sector" && event.target.value === asset.sector);
}

function normalized(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? clamp(value, -1, 1) : undefined;
}

function applyFundamentalImpact(
  fundamentals: StockFundamentals,
  event: MarketEvent
): StockFundamentals {
  if (!event.fundamentalImpact || !event.significance) return fundamentals;
  const scale = FUNDAMENTAL_IMPACT_SCALE[event.significance];
  const next = { ...fundamentals };
  for (const dimension of FUNDAMENTAL_DIMENSIONS) {
    const impact = normalized(event.fundamentalImpact[dimension]);
    if (impact !== undefined) next[dimension] = clamp(fundamentals[dimension] + impact * scale, -1, 1);
  }
  return next;
}

function applyExpectationUpdate(
  expectations: MarketExpectations,
  event: MarketEvent
): MarketExpectations {
  if (!event.outcome || !event.significance) return expectations;
  const scale = EXPECTATION_UPDATE_SCALE[event.significance];
  const next = { ...expectations };
  for (const dimension of EXPECTATION_DIMENSIONS) {
    const outcome = normalized(event.outcome[dimension]);
    if (outcome !== undefined) {
      next[dimension] = clamp(expectations[dimension] + (outcome - expectations[dimension]) * scale, -1, 1);
    }
  }
  return next;
}

/**
 * Applies public stock-event information to hidden company reality. The
 * runtime owns exactly-once scheduling and persistence of this pure update.
 */
export function applyStockEventConsequences(state: MarketState, event: MarketEvent): MarketState {
  if (event.consequenceVersion !== 1 || !event.significance) return state;

  let changed = false;
  const assets = state.assets.map((asset) => {
    if (!matchesStock(event, asset) || !asset.fundamentals || !asset.expectations) return asset;
    const fundamentals = applyFundamentalImpact(asset.fundamentals, event);
    const expectations = applyExpectationUpdate(asset.expectations, event);
    if (fundamentals === asset.fundamentals && expectations === asset.expectations) return asset;
    changed = true;
    return { ...asset, fundamentals, expectations };
  });
  return changed ? { ...state, assets } : state;
}
