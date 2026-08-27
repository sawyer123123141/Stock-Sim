import type { AssetState, AssetTickResult, MovementContribution, TickContext } from "../../shared/src/index.js";
import { calculateDemandPressure } from "./demand.js";
import { explainMovement } from "./explain.js";
import { clamp, round } from "./math.js";
import type { RandomSource } from "./rng.js";

const STOCK_MAX_TICK_RETURN = 0.03;
const CRYPTO_MAX_TICK_RETURN = 0.08;

function contribution(
  code: MovementContribution["code"],
  label: string,
  value: number,
  summaryUp: string,
  summaryDown: string
): MovementContribution {
  return { code, label, value, summaryUp, summaryDown };
}

function stockContributions(asset: AssetState, context: TickContext, rng: RandomSource): MovementContribution[] {
  const demand = calculateDemandPressure(context.demand);
  const noise = (rng() * 2 - 1) * asset.baselineVolatility * 0.004;
  const company = ((asset.companyStrength ?? 0) - 0.25) * 0.0014;

  return [
    contribution("company", "Company strength", company, "The company looks financially strong, which is attracting investors.", "Concerns about the company itself are weighing on the price."),
    contribution("sector", "Sector trend", asset.sectorTrend * 0.0014, "The wider sector is performing well and helping this stock.", "The wider sector is weak and pulling this stock down."),
    contribution("sentiment", "Public sentiment", asset.sentiment * 0.001, "Investors are feeling more optimistic about this company.", "Investors are feeling less confident about this company."),
    contribution("momentum", "Recent momentum", asset.momentum * 0.0008, "Recent gains are attracting more attention.", "Recent losses are making traders more cautious."),
    contribution("demand", "Buying pressure", demand * 0.0016, "Buying interest is stronger than selling pressure.", "Selling pressure is stronger than buying interest."),
    contribution("news", "News and events", context.eventEffect * 0.0022, "Positive news is attracting investors.", "Negative news is pushing investors away."),
    contribution("noise", "Normal market movement", noise, "Normal trading activity is giving the price a small lift.", "Normal trading activity is nudging the price lower.")
  ];
}

function cryptoContributions(asset: AssetState, context: TickContext, rng: RandomSource): MovementContribution[] {
  const demand = calculateDemandPressure(context.demand);
  const noise = (rng() * 2 - 1) * asset.baselineVolatility * 0.009;

  return [
    contribution("sector", "Crypto market trend", asset.sectorTrend * 0.0006, "The broader crypto market is helping this coin.", "The broader crypto market is dragging this coin down."),
    contribution("sentiment", "Community sentiment", asset.sentiment * 0.0024, "Excitement around this coin is increasing.", "Confidence around this coin is fading."),
    contribution("momentum", "Recent momentum", asset.momentum * 0.0026, "Recent gains are pulling in more traders.", "Recent losses are making traders back away."),
    contribution("demand", "Trading pressure", demand * 0.0028, "Buying activity is outweighing selling activity.", "Selling activity is outweighing buying activity."),
    contribution("news", "News and events", context.eventEffect * 0.0032, "Positive news is creating extra attention around this coin.", "Negative news is hurting confidence in this coin."),
    contribution("noise", "Fast market movement", noise, "Fast trading is pushing the price higher.", "Fast trading is pushing the price lower.")
  ];
}

export function tickAsset(asset: AssetState, context: TickContext, rng: RandomSource): AssetTickResult {
  const contributions = asset.kind === "stock"
    ? stockContributions(asset, context, rng)
    : cryptoContributions(asset, context, rng);

  const rawReturn = contributions.reduce((sum, item) => sum + item.value, 0);
  const maxReturn = asset.kind === "stock" ? STOCK_MAX_TICK_RETURN : CRYPTO_MAX_TICK_RETURN;
  const returnFraction = clamp(rawReturn, -maxReturn, maxReturn);
  const nextPrice = round(Math.max(0.000001, asset.price * (1 + returnFraction)), 6);
  const nextMomentum = clamp(asset.momentum * 0.72 + (returnFraction / maxReturn) * 0.28, -1, 1);

  return {
    returnFraction,
    contributions,
    asset: {
      ...asset,
      price: nextPrice,
      changePct: round(returnFraction * 100, 4),
      momentum: round(nextMomentum, 6),
      reasons: explainMovement(contributions)
    }
  };
}
