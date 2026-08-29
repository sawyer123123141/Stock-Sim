import type {
  MarketEvent,
  MarketEventSnapshot,
  MarketStory,
  MarketStorySnapshot,
  MarketPressure,
  MarketReadSnapshot,
  MarketSnapshot,
  MarketState
} from "../../shared/src/index.js";
import { combinedPrimaryEventEffect, combinedRelationshipEventEffect, eventEffectForAsset } from "./events.js";
import { companyRelationshipSnapshots } from "./companyRelationships.js";
import { calculateMarketRead } from "./marketRead.js";
import { toStockResearchSnapshot } from "./research.js";
import type { RandomSource } from "./rng.js";
import { tickAsset } from "./tick.js";

export type PressureByAsset = Readonly<Record<string, MarketPressure | undefined>>;
export type MarketReadByAsset = Readonly<Record<string, MarketReadSnapshot | undefined>>;

const ZERO_PRESSURE: MarketPressure = { simulated: 0, player: 0 };

export function tickMarket(
  state: MarketState,
  nowMs: number,
  deltaMs: number,
  pressureByAsset: PressureByAsset,
  rng: RandomSource
): MarketState {
  return {
    sequence: state.sequence + 1,
    activeEvents: state.activeEvents.filter((event) => event.expiresAt > nowMs),
    stories: state.stories ?? [],
    assets: state.assets.map((asset) => {
      const relationshipSourceName = relatedCompanyName(state, asset, nowMs);
      return tickAsset(asset, {
        demand: pressureByAsset[asset.id] ?? ZERO_PRESSURE,
        eventEffect: combinedPrimaryEventEffect(state.activeEvents, asset, nowMs),
        relationshipEffect: combinedRelationshipEventEffect(state.activeEvents, asset, nowMs),
        ...(relationshipSourceName !== undefined ? { relationshipSourceName } : {}),
        deltaMs
      }, rng).asset;
    })
  };
}

export function toMarketSnapshot(
  state: MarketState,
  generatedAtMs: number,
  marketReadByAsset: MarketReadByAsset = {}
): MarketSnapshot {
  return {
    sequence: state.sequence,
    generatedAt: new Date(generatedAtMs).toISOString(),
    assets: state.assets.map((asset) => {
      const research = toStockResearchSnapshot(asset);
      return {
        id: asset.id,
        symbol: asset.symbol,
        name: asset.name,
        kind: asset.kind,
        sector: asset.sector,
        price: asset.price,
        lastTickChangePct: asset.lastTickChangePct,
        marketRead: marketReadByAsset[asset.id] ?? calculateMarketRead(asset, ZERO_PRESSURE),
        ...(research ? { research } : {}),
        ...(asset.kind === "stock" ? { relationships: companyRelationshipSnapshots(asset, state.assets) } : {}),
        reasons: asset.reasons.map((reason) => ({
          code: reason.code,
          label: reason.label,
          direction: reason.direction,
          strength: reason.weight < 0.0005 ? "small" : reason.weight < 0.0015 ? "moderate" : "strong",
          summary: reason.summary
        }))
      };
    }),
    events: state.activeEvents
      .filter((event) => !event.relationship && event.publishedAt <= generatedAtMs && event.expiresAt > generatedAtMs)
      .map(toMarketEventSnapshot),
    stories: toMarketStorySnapshots(state.stories ?? [], generatedAtMs)
  };
}

/**
 * Projects only currently public story information. This is intentionally the
 * sole boundary between persisted story plans and browser-visible data.
 */
export function toMarketStorySnapshots(
  stories: MarketStory[],
  generatedAtMs: number
): MarketStorySnapshot[] {
  return stories.flatMap((story) => {
    const updates = story.updates
      .filter((update) => update.state === "published" && update.publishedAt <= generatedAtMs)
      .sort((left, right) => left.publishedAt - right.publishedAt || left.id.localeCompare(right.id))
      .map((update) => ({
        id: update.id,
        title: update.title,
        summary: update.summary,
        publishedAt: new Date(update.publishedAt).toISOString(),
        ...(update.relatedAssetIds?.length ? { relatedAssetIds: [...update.relatedAssetIds].sort() } : {})
      }));
    if (updates.length === 0) return [];
    return [{
      id: story.id,
      title: story.title,
      target: { ...story.target },
      status: story.status,
      updates
    }];
  });
}

function relatedCompanyName(state: MarketState, asset: MarketState["assets"][number], nowMs: number): string | undefined {
  const event = state.activeEvents
    .filter((candidate) => candidate.relationship && eventEffectForAsset(candidate, asset, nowMs) !== 0)
    .sort((left, right) => Math.abs(eventEffectForAsset(right, asset, nowMs)) - Math.abs(eventEffectForAsset(left, asset, nowMs)))[0];
  return event?.relationship
    ? state.assets.find((candidate) => candidate.id === event.relationship?.sourceAssetId)?.name
    : undefined;
}

function toMarketEventSnapshot(event: MarketEvent): MarketEventSnapshot {
  return {
    id: event.id,
    title: event.title,
    summary: event.summary,
    target: { ...event.target },
    publishedAt: new Date(event.publishedAt).toISOString(),
    reactionStartsAt: new Date(event.reactionStartsAt).toISOString(),
    expiresAt: new Date(event.expiresAt).toISOString()
  };
}
