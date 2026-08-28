import type { MarketEvent, MarketEventTarget } from "../../shared/src/index.js";
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
  effect: number;
  target: MarketEventTarget;
  reactsQuickly?: boolean;
}

const EVENT_CATALOG: readonly MarketEventTemplate[] = [
  {
    id: "nova-demand",
    title: "Nova's commuter launch draws a crowd",
    summary: "Early showroom interest is strong, but production follow-through is still unknown.",
    effect: 0.48,
    target: { kind: "asset", value: "nova" }
  },
  {
    id: "nova-production",
    title: "Nova reports a supplier review",
    summary: "The company is checking a production issue; investors are still waiting for the full impact.",
    effect: -0.44,
    target: { kind: "asset", value: "nova" }
  },
  {
    id: "luma-breakthrough",
    title: "Luma demonstrates a new battery material",
    summary: "The demonstration has attracted attention, though commercial scale remains unproven.",
    effect: 0.5,
    target: { kind: "asset", value: "luma" }
  },
  {
    id: "luma-update",
    title: "Luma trims its launch timetable",
    summary: "The revised timeline raises questions, but the company says its longer-term work continues.",
    effect: -0.4,
    target: { kind: "asset", value: "luma" }
  },
  {
    id: "harvest-contract",
    title: "Harvest Grid wins a regional storage contract",
    summary: "The deal could support demand over time, although its financial contribution is not yet clear.",
    effect: 0.42,
    target: { kind: "asset", value: "hgrid" }
  },
  {
    id: "energy-slowdown",
    title: "Grid spending outlook softens",
    summary: "A cautious infrastructure outlook is weighing on energy projects, with details still emerging.",
    effect: -0.36,
    target: { kind: "sector", value: "Energy" }
  },
  {
    id: "mobility-tailwind",
    title: "City fleets accelerate electrification plans",
    summary: "New procurement interest may help mobility companies, but contracts will take time to develop.",
    effect: 0.34,
    target: { kind: "sector", value: "Mobility" }
  },
  {
    id: "technology-review",
    title: "Technology spending faces a closer review",
    summary: "Buyers are reassessing budgets, though demand could recover as plans are finalized.",
    effect: -0.32,
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
}

export function createMarketEvent(options: CreateMarketEventOptions): MarketEvent {
  const templateIndex = Math.min(EVENT_CATALOG.length - 1, Math.floor(options.rng() * EVENT_CATALOG.length));
  const template = EVENT_CATALOG[templateIndex] as MarketEventTemplate;
  const reactionLeadMs = template.reactsQuickly ? CRYPTO_REACTION_LEAD_MS : STOCK_REACTION_LEAD_MS;
  const reactionDurationMs = template.reactsQuickly ? CRYPTO_REACTION_DURATION_MS : STOCK_REACTION_DURATION_MS;
  const reactionStartsAt = options.publishedAt + reactionLeadMs;

  return {
    id: options.id,
    title: template.title,
    summary: template.summary,
    effect: template.effect,
    publishedAt: options.publishedAt,
    reactionStartsAt,
    expiresAt: reactionStartsAt + reactionDurationMs,
    target: { ...template.target }
  };
}
