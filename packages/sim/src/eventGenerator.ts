import type {
  AssetState,
  EventSignificance,
  MarketEvent,
  MarketEventTarget,
  StockEventOutcome
} from "../../shared/src/index.js";
import { clamp } from "./math.js";
import type { RandomSource } from "./rng.js";

const STOCK_REACTION_LEAD_MS = 45_000;
const STOCK_REACTION_DURATION_MS = 150_000;
const CRYPTO_REACTION_LEAD_MS = 15_000;
const CRYPTO_REACTION_DURATION_MS = 90_000;

export const FIRST_EVENT_DELAY_MS = 45_000;
export const EVENT_CADENCE_MS = 120_000;

interface MarketEventTemplate {
  id: string;
  title: string;
  summary: string;
  target: MarketEventTarget;
  effect?: number;
  outcome?: StockEventOutcome;
  significance?: EventSignificance;
  reactsQuickly?: boolean;
}

const EVENT_CATALOG: readonly MarketEventTemplate[] = [
  {
    id: "nova-demand",
    title: "Nova's commuter launch draws a crowd",
    summary: "Early showroom interest is strong, but production follow-through is still unknown.",
    outcome: { demand: 1, growth: 0.7, execution: 0.45 },
    significance: "normal",
    target: { kind: "asset", value: "nova" }
  },
  {
    id: "nova-production",
    title: "Nova reports a supplier review",
    summary: "The company is checking a production issue; investors are still waiting for the full impact.",
    outcome: { execution: -0.8, profitability: -0.45 },
    significance: "major",
    target: { kind: "asset", value: "nova" }
  },
  {
    id: "luma-breakthrough",
    title: "Luma demonstrates a new battery material",
    summary: "The demonstration has attracted attention, though commercial scale remains unproven.",
    outcome: { growth: 0.9, execution: 0.4, competitivePosition: 0.85 },
    significance: "major",
    target: { kind: "asset", value: "luma" }
  },
  {
    id: "luma-update",
    title: "Luma trims its launch timetable",
    summary: "The revised timeline raises questions, but the company says its longer-term work continues.",
    outcome: { growth: 0.45, execution: -0.5, reputation: -0.2 },
    significance: "normal",
    target: { kind: "asset", value: "luma" }
  },
  {
    id: "harvest-contract",
    title: "Harvest Grid wins a regional storage contract",
    summary: "The deal could support demand over time, although its financial contribution is not yet clear.",
    outcome: { demand: 0.5, profitability: 0.5, execution: 0.35 },
    significance: "normal",
    target: { kind: "asset", value: "hgrid" }
  },
  {
    id: "energy-slowdown",
    title: "Grid spending outlook softens",
    summary: "A cautious infrastructure outlook is weighing on energy projects, with details still emerging.",
    outcome: { demand: -0.35, growth: -0.2 },
    significance: "normal",
    target: { kind: "sector", value: "Energy" }
  },
  {
    id: "mobility-tailwind",
    title: "City fleets accelerate electrification plans",
    summary: "New procurement interest may help mobility companies, but contracts will take time to develop.",
    outcome: { demand: 0.95, growth: 0.65 },
    significance: "normal",
    target: { kind: "sector", value: "Mobility" }
  },
  {
    id: "technology-review",
    title: "Technology spending faces a closer review",
    summary: "Buyers are reassessing budgets, though demand could recover as plans are finalized.",
    outcome: { demand: 0.25, growth: 0.45, execution: 0.25 },
    significance: "normal",
    target: { kind: "sector", value: "Technology" }
  },
  {
    id: "crypto-adoption",
    title: "Digital-asset payments gain a new pilot",
    summary: "The pilot is drawing fast attention, but its real adoption is still uncertain.",
    effect: 0.38,
    target: { kind: "sector", value: "Crypto" },
    reactsQuickly: true
  },
  {
    id: "global-confidence",
    title: "Consumer confidence sends mixed signals",
    summary: "The broader outlook is shifting, but investors are interpreting the new data differently.",
    effect: -0.28,
    target: { kind: "global" }
  }
];

export interface CreateMarketEventOptions {
  id: string;
  publishedAt: number;
  rng: RandomSource;
  assets: AssetState[];
}

const EXPECTATION_DIMENSIONS = ["growth", "profitability", "demand", "execution"] as const;
const SIGNIFICANCE_EFFECT_SCALE: Readonly<Record<EventSignificance, number>> = {
  minor: 0.3,
  normal: 0.8,
  major: 0.9,
  transformative: 1
};
const COMPATIBILITY_RESPONSE_GAIN = 10;
const MAX_COMPATIBILITY_EFFECT = 0.75;

function matchingStocks(target: MarketEventTarget, assets: AssetState[]): AssetState[] {
  return assets.filter((asset) => asset.kind === "stock" && (
    (target.kind === "asset" && target.value === asset.id)
    || (target.kind === "sector" && target.value === asset.sector)
  ));
}

function normalizedOutcomeValue(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? clamp(value, -1, 1) : 0;
}

function averageExpectedOutcome(
  outcome: StockEventOutcome,
  assets: AssetState[]
): StockEventOutcome {
  const expectedOutcome: StockEventOutcome = {};
  for (const dimension of EXPECTATION_DIMENSIONS) {
    if (outcome[dimension] === undefined) continue;
    const values = assets
      .map((asset) => asset.expectations?.[dimension])
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    if (values.length === 0) continue;
    expectedOutcome[dimension] = clamp(
      values.reduce((sum, value) => sum + value, 0) / values.length,
      -1,
      1
    );
  }
  return expectedOutcome;
}

/**
 * Equally weights each revealed dimension with a direct expectation analogue.
 * Each actual-minus-expected delta is divided by two before averaging so the
 * returned surprise remains normalized to -1..1.
 */
export function calculateStockEventSurprise(
  outcome: StockEventOutcome,
  expectedOutcome: StockEventOutcome
): number {
  const deltas = EXPECTATION_DIMENSIONS.flatMap((dimension) => {
    const actual = outcome[dimension];
    const expected = expectedOutcome[dimension];
    if (actual === undefined || expected === undefined) return [];
    return [(normalizedOutcomeValue(actual) - normalizedOutcomeValue(expected)) / 2];
  });
  if (deltas.length === 0) return 0;
  return clamp(deltas.reduce((sum, value) => sum + value, 0) / deltas.length, -1, 1);
}

/**
 * Bridges stock-event surprise into the existing effect-driven price system.
 * It is a bounded influence signal, not a guaranteed percentage return.
 */
export function effectFromStockEventSurprise(
  surprise: number,
  significance: EventSignificance
): number {
  const boundedResponse = Math.tanh(clamp(surprise, -1, 1) * COMPATIBILITY_RESPONSE_GAIN)
    * MAX_COMPATIBILITY_EFFECT;
  return boundedResponse * SIGNIFICANCE_EFFECT_SCALE[significance];
}

export function createMarketEvent(options: CreateMarketEventOptions): MarketEvent {
  const templateIndex = Math.min(EVENT_CATALOG.length - 1, Math.floor(options.rng() * EVENT_CATALOG.length));
  const template = EVENT_CATALOG[templateIndex] as MarketEventTemplate;
  const reactionLeadMs = template.reactsQuickly ? CRYPTO_REACTION_LEAD_MS : STOCK_REACTION_LEAD_MS;
  const reactionDurationMs = template.reactsQuickly ? CRYPTO_REACTION_DURATION_MS : STOCK_REACTION_DURATION_MS;
  const reactionStartsAt = options.publishedAt + reactionLeadMs;

  const event: MarketEvent = {
    id: options.id,
    title: template.title,
    summary: template.summary,
    effect: template.effect ?? 0,
    publishedAt: options.publishedAt,
    reactionStartsAt,
    expiresAt: reactionStartsAt + reactionDurationMs,
    target: { ...template.target }
  };

  if (!template.outcome || !template.significance) return event;
  const stocks = matchingStocks(template.target, options.assets);
  if (stocks.length === 0) return event;

  const outcome = Object.fromEntries(
    Object.entries(template.outcome).map(([dimension, value]) => [dimension, normalizedOutcomeValue(value)])
  ) as StockEventOutcome;
  const expectedOutcome = averageExpectedOutcome(outcome, stocks);
  const surprise = calculateStockEventSurprise(outcome, expectedOutcome);
  return {
    ...event,
    effect: effectFromStockEventSurprise(surprise, template.significance),
    outcome,
    expectedOutcome,
    surprise,
    significance: template.significance
  };
}
