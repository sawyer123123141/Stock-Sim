import type { AssetState, AssetTickResult, MovementContribution, TickContext } from "../../shared/src/index.js";
import { calculateDemandPressure } from "./demand.js";
import { explainMovement } from "./explain.js";
import { clamp, round } from "./math.js";
import type { RandomSource } from "./rng.js";

const STOCK_REFERENCE_TICK_MS = 60_000;
const CRYPTO_REFERENCE_TICK_MS = 5_000;
const STOCK_MAX_TICK_RETURN = 0.01;
const CRYPTO_MAX_TICK_RETURN = 0.03;
const STOCK_NOISE_SCALE = 0.009;
const STOCK_EVENT_SCALE = 0.006;

function contribution(
  code: MovementContribution["code"],
  label: string,
  value: number,
  summaryUp: string,
  summaryDown: string
): MovementContribution {
  return { code, label, value, summaryUp, summaryDown };
}

function scales(asset: AssetState, deltaMs: number): { linear: number; noise: number } {
  const referenceMs = asset.kind === "stock" ? STOCK_REFERENCE_TICK_MS : CRYPTO_REFERENCE_TICK_MS;
  const linear = Math.max(0, deltaMs) / referenceMs;
  return { linear, noise: Math.sqrt(linear) };
}

function stockContributions(asset: AssetState, context: TickContext, rng: RandomSource): MovementContribution[] {
  const demand = calculateDemandPressure(context.demand);
  const time = scales(asset, context.deltaMs);
  const noise = (rng() * 2 - 1) * asset.baselineVolatility * STOCK_NOISE_SCALE * time.noise;
  const company = ((asset.companyStrength ?? 0) - 0.25) * 0.00004 * time.linear;

  return [
    contribution("company", "Company strength", company, "The company looks financially strong, which is attracting investors.", "Concerns about the company itself are weighing on the price."),
    contribution("sector", "Sector trend", asset.sectorTrend * 0.00004 * time.linear, "The wider sector is performing well and helping this stock.", "The wider sector is weak and pulling this stock down."),
    contribution("sentiment", "Public sentiment", asset.sentiment * 0.00003 * time.linear, "Investors are feeling more optimistic about this company.", "Investors are feeling less confident about this company."),
    contribution("momentum", "Recent momentum", asset.momentum * 0.00004 * time.linear, "Recent gains are attracting more attention.", "Recent losses are making traders more cautious."),
    contribution("demand", "Buying pressure", demand * 0.0004 * time.linear, "Buying interest is stronger than selling pressure.", "Selling pressure is stronger than buying interest."),
    contribution("news", "News and events", context.eventEffect * STOCK_EVENT_SCALE * time.linear, "Positive news is attracting investors.", "Negative news is pushing investors away."),
    contribution("noise", "Normal market movement", noise, "Normal trading activity is giving the price a small lift.", "Normal trading activity is nudging the price lower.")
  ];
}

function cryptoContributions(asset: AssetState, context: TickContext, rng: RandomSource): MovementContribution[] {
  const demand = calculateDemandPressure(context.demand);
  const time = scales(asset, context.deltaMs);
  const noise = (rng() * 2 - 1) * asset.baselineVolatility * 0.0015 * time.noise;

  return [
    contribution("sector", "Crypto market trend", asset.sectorTrend * 0.000005 * time.linear, "The broader crypto market is helping this coin.", "The broader crypto market is dragging this coin down."),
    contribution("sentiment", "Community sentiment", asset.sentiment * 0.000012 * time.linear, "Excitement around this coin is increasing.", "Confidence around this coin is fading."),
    contribution("momentum", "Recent momentum", asset.momentum * 0.000015 * time.linear, "Recent gains are pulling in more traders.", "Recent losses are making traders back away."),
    contribution("demand", "Trading pressure", demand * 0.0001 * time.linear, "Buying activity is outweighing selling activity.", "Selling activity is outweighing buying activity."),
    contribution("news", "News and events", context.eventEffect * 0.00025 * time.linear, "Positive news is creating extra attention around this coin.", "Negative news is hurting confidence in this coin."),
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
  const time = scales(asset, context.deltaMs);
  const momentumRetention = Math.pow(0.72, time.linear);
  const momentumSignal = returnFraction / maxReturn;
  const nextMomentum = clamp(
    asset.momentum * momentumRetention + momentumSignal * (1 - momentumRetention),
    -1,
    1
  );

  return {
    returnFraction,
    contributions,
    asset: {
      ...asset,
      price: nextPrice,
      lastTickChangePct: round(returnFraction * 100, 4),
      momentum: round(nextMomentum, 6),
      reasons: explainMovement(contributions)
    }
  };
}
