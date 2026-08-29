import type {
  AssetState,
  EventSignificance,
  MarketEvent,
  MarketEventTarget,
  MarketStory,
  MarketStoryUpdate,
  StockEventOutcome,
  StockFundamentals
} from "../../shared/src/index.js";
import { clamp } from "./math.js";
import type { RandomSource } from "./rng.js";

const STOCK_REACTION_LEAD_MS = 45_000;
const STOCK_REACTION_DURATION_MS = 150_000;
const CRYPTO_REACTION_LEAD_MS = 15_000;
const CRYPTO_REACTION_DURATION_MS = 90_000;

export const FIRST_EVENT_DELAY_MS = 45_000;
export const EVENT_CADENCE_MS = 120_000;
export const STORY_FOLLOW_UP_DELAY_MS = 60_000;

interface MarketEventTemplate {
  id: string;
  title: string;
  summary: string;
  target: MarketEventTarget;
  effect?: number;
  outcome?: StockEventOutcome;
  significance?: EventSignificance;
  fundamentalImpact?: Partial<StockFundamentals>;
  reactsQuickly?: boolean;
}

interface StoryUpdateTemplate {
  id: string;
  title: string;
  summary: string;
  outcome?: StockEventOutcome;
  significance?: EventSignificance;
  fundamentalImpact?: Partial<StockFundamentals>;
  effectHint?: number;
  reactsQuickly?: boolean;
}

const EVENT_CATALOG: readonly MarketEventTemplate[] = [
  {
    id: "nova-demand",
    title: "Nova's commuter launch draws a crowd",
    summary: "Early showroom interest is strong, but production follow-through is still unknown.",
    outcome: { demand: 1, growth: 0.7, execution: 0.45 },
    significance: "normal",
    fundamentalImpact: { growth: 0.08, reputation: 0.04 },
    target: { kind: "asset", value: "nova" }
  },
  {
    id: "nova-production",
    title: "Nova reports a supplier review",
    summary: "The company is checking a production issue; investors are still waiting for the full impact.",
    outcome: { execution: -0.8, profitability: -0.45 },
    significance: "major",
    fundamentalImpact: { profitability: -0.08, reputation: -0.03 },
    target: { kind: "asset", value: "nova" }
  },
  {
    id: "luma-breakthrough",
    title: "Luma demonstrates a new battery material",
    summary: "The demonstration has attracted attention, though commercial scale remains unproven.",
    outcome: { growth: 0.9, execution: 0.4, competitivePosition: 0.85 },
    significance: "major",
    fundamentalImpact: { growth: 0.1, competitivePosition: 0.16, reputation: 0.06 },
    target: { kind: "asset", value: "luma" }
  },
  {
    id: "luma-update",
    title: "Luma trims its launch timetable",
    summary: "The revised timeline raises questions, but the company says its longer-term work continues.",
    outcome: { growth: 0.45, execution: -0.5, reputation: -0.2 },
    significance: "normal",
    fundamentalImpact: { growth: -0.04, reputation: -0.05 },
    target: { kind: "asset", value: "luma" }
  },
  {
    id: "harvest-contract",
    title: "Harvest Grid wins a regional storage contract",
    summary: "The deal could support demand over time, although its financial contribution is not yet clear.",
    outcome: { demand: 0.5, profitability: 0.5, execution: 0.35 },
    significance: "normal",
    fundamentalImpact: { growth: 0.03, profitability: 0.06, reputation: 0.02 },
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

const STORY_TEMPLATES: Readonly<Record<string, { title: string; updates: readonly StoryUpdateTemplate[] }>> = {
  "nova-demand": {
    title: "NOVA's commuter launch",
    updates: [
      {
        id: "demand",
        title: "Strong showroom demand reported",
        summary: "Early buyers are showing unusually strong interest in NOVA's new commuter model.",
        outcome: { demand: 1, growth: 0.7 },
        significance: "normal",
        fundamentalImpact: { growth: 0.05, reputation: 0.03 }
      },
      {
        id: "production",
        title: "Production capacity questioned",
        summary: "The company is reviewing whether fulfillment can keep pace with demand.",
        outcome: { execution: 0.35 },
        significance: "normal",
        fundamentalImpact: { growth: 0.03, reputation: 0.01 }
      }
    ]
  },
  "nova-production": {
    title: "NOVA supplier review",
    updates: [
      {
        id: "review",
        title: "Supplier review announced",
        summary: "NOVA is reviewing a production issue, though the extent of disruption is not yet clear.",
        outcome: { execution: -0.45 },
        significance: "major"
      },
      {
        id: "impact",
        title: "Production impact comes into focus",
        summary: "The review points to a deeper hit to output and margins than first understood.",
        outcome: { execution: -0.8, profitability: -0.45 },
        significance: "major",
        fundamentalImpact: { profitability: -0.08, reputation: -0.03 }
      }
    ]
  },
  "luma-breakthrough": {
    title: "LUMA battery breakthrough",
    updates: [
      {
        id: "demonstration",
        title: "Technical demonstration succeeds",
        summary: "LUMA's battery-material demonstration has strengthened interest in its technology.",
        outcome: { growth: 0.9, competitivePosition: 0.85 },
        significance: "major",
        fundamentalImpact: { competitivePosition: 0.1, reputation: 0.03 }
      },
      {
        id: "scaling",
        title: "Commercial scaling details emerge",
        summary: "The technical result stands, but production-scale requirements appear more demanding than hoped.",
        outcome: { growth: 0.45, execution: 0.25 },
        significance: "major",
        fundamentalImpact: { growth: 0.1, competitivePosition: 0.06, reputation: 0.03 }
      }
    ]
  },
  "luma-update": {
    title: "LUMA timetable revision",
    updates: [
      {
        id: "delay",
        title: "Launch timetable revised",
        summary: "LUMA has pushed back part of its launch schedule while it works through the revised plan.",
        outcome: { execution: -0.5 },
        significance: "normal",
        fundamentalImpact: { reputation: -0.04 }
      },
      {
        id: "progress",
        title: "Broader development progress clarified",
        summary: "The revised timing affects the near term, while longer-range work remains on track.",
        outcome: { growth: 0.45 },
        significance: "normal",
        fundamentalImpact: { growth: -0.04, reputation: -0.01 }
      }
    ]
  },
  "harvest-contract": {
    title: "Harvest Grid storage contract",
    updates: [
      {
        id: "award",
        title: "Regional storage contract awarded",
        summary: "Harvest Grid has secured a new regional storage project with demand potential over time.",
        outcome: { demand: 0.5 },
        significance: "normal",
        fundamentalImpact: { growth: 0.03, reputation: 0.02 }
      },
      {
        id: "financials",
        title: "Contract contribution clarified",
        summary: "Further detail suggests the project can support both execution and profitability.",
        outcome: { profitability: 0.5, execution: 0.35 },
        significance: "normal",
        fundamentalImpact: { profitability: 0.06 }
      }
    ]
  }
};

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

function reactionTiming(publishedAt: number, reactsQuickly: boolean | undefined): Pick<MarketEvent, "reactionStartsAt" | "expiresAt"> {
  const reactionLeadMs = reactsQuickly ? CRYPTO_REACTION_LEAD_MS : STOCK_REACTION_LEAD_MS;
  const reactionDurationMs = reactsQuickly ? CRYPTO_REACTION_DURATION_MS : STOCK_REACTION_DURATION_MS;
  const reactionStartsAt = publishedAt + reactionLeadMs;
  return { reactionStartsAt, expiresAt: reactionStartsAt + reactionDurationMs };
}

function storyUpdate(
  template: StoryUpdateTemplate,
  storyId: string,
  publishedAt: number
): MarketStoryUpdate {
  return {
    id: `${storyId}:${template.id}`,
    title: template.title,
    summary: template.summary,
    publishedAt,
    state: "pending",
    ...(template.outcome ? { outcome: { ...template.outcome } } : {}),
    ...(template.significance ? { significance: template.significance } : {}),
    ...(template.fundamentalImpact ? { fundamentalImpact: { ...template.fundamentalImpact } } : {}),
    ...(template.effectHint !== undefined ? { effectHint: template.effectHint } : {}),
    ...(template.reactsQuickly ? { reactsQuickly: true } : {})
  };
}

/**
 * Creates a deterministic private information plan. It intentionally does not
 * read expectations or resolve future surprise/effect values.
 */
export function createMarketStory(options: CreateMarketEventOptions): MarketStory {
  const templateIndex = Math.min(EVENT_CATALOG.length - 1, Math.floor(options.rng() * EVENT_CATALOG.length));
  const template = EVENT_CATALOG[templateIndex] as MarketEventTemplate;
  const planned = STORY_TEMPLATES[template.id];
  const updates: readonly StoryUpdateTemplate[] = planned?.updates ?? [{
    id: "initial",
    title: template.title,
    summary: template.summary,
    ...(template.outcome ? { outcome: template.outcome } : {}),
    ...(template.significance ? { significance: template.significance } : {}),
    ...(template.fundamentalImpact ? { fundamentalImpact: template.fundamentalImpact } : {}),
    ...(template.effect !== undefined ? { effectHint: template.effect } : {}),
    ...(template.reactsQuickly ? { reactsQuickly: true } : {})
  }];
  return {
    id: options.id,
    title: planned?.title ?? template.title,
    target: { ...template.target },
    status: "developing",
    updates: updates.map((update, index) => storyUpdate(
      update,
      options.id,
      options.publishedAt + index * STORY_FOLLOW_UP_DELAY_MS
    ))
  };
}

/**
 * Resolves one update at its canonical public time and materializes its single
 * existing event reaction. Only this point snapshots current expectations.
 */
export function publishMarketStoryUpdate(
  story: MarketStory,
  update: MarketStoryUpdate,
  assets: AssetState[]
): { update: MarketStoryUpdate; event: MarketEvent } {
  if (update.state !== "pending") throw new RangeError(`Story update ${update.id} is already published.`);
  const eventBase: MarketEvent = {
    id: update.id,
    title: update.title,
    summary: update.summary,
    effect: update.effectHint ?? 0,
    publishedAt: update.publishedAt,
    target: { ...story.target },
    ...reactionTiming(update.publishedAt, update.reactsQuickly)
  };
  if (!update.outcome || !update.significance) {
    return {
      update: { ...update, state: "published", effect: eventBase.effect },
      event: eventBase
    };
  }

  const stocks = matchingStocks(story.target, assets);
  const outcome = Object.fromEntries(
    Object.entries(update.outcome).map(([dimension, value]) => [dimension, normalizedOutcomeValue(value)])
  ) as StockEventOutcome;
  const expectedOutcome = averageExpectedOutcome(outcome, stocks);
  const surprise = calculateStockEventSurprise(outcome, expectedOutcome);
  const effect = effectFromStockEventSurprise(surprise, update.significance);
  const event: MarketEvent = {
    ...eventBase,
    effect,
    outcome,
    expectedOutcome,
    surprise,
    significance: update.significance,
    ...(update.fundamentalImpact ? { fundamentalImpact: { ...update.fundamentalImpact } } : {}),
    consequenceVersion: 1
  };
  return {
    update: { ...update, state: "published", expectedOutcome, surprise, effect },
    event
  };
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
    significance: template.significance,
    ...(template.fundamentalImpact ? { fundamentalImpact: template.fundamentalImpact } : {}),
    consequenceVersion: 1
  };
}
