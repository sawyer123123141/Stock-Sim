import { RECENT_STORY_WINDOW_MS } from "../../shared/src/index.js";
import type {
  MarketEvent,
  MarketEventSnapshot,
  MarketStory,
  MarketStoryHistory,
  MarketStoryHistoryUpdate,
  MarketStoryLifecycle,
  MarketStorySnapshot,
  MarketStoryStatus,
  MarketStoryUpdate,
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
    storyHistory: state.storyHistory ?? [],
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
    storyRecentWindowMs: RECENT_STORY_WINDOW_MS,
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
    stories: toMarketStorySnapshots(state.stories ?? [], generatedAtMs, state.storyHistory ?? [])
  };
}

/**
 * Projects only currently public story information. This is intentionally the
 * sole boundary between persisted story plans and browser-visible data.
 */
export function toMarketStorySnapshots(
  stories: MarketStory[],
  generatedAtMs: number,
  history: MarketStoryHistory[] = []
): MarketStorySnapshot[] {
  const runtime = stories.flatMap((story) => toRuntimeStorySnapshot(story, generatedAtMs));
  const compact = toMarketStoryHistorySnapshots(
    history.filter((story) => isRecentHistoryStory(story, generatedAtMs)),
    generatedAtMs
  );
  const runtimeIds = new Set(runtime.map((story) => story.id));
  return [...runtime, ...compact.filter((story) => !runtimeIds.has(story.id))]
    .filter((story) => story.lifecycle !== "archive");
}

/** Projects compact persisted history without loading it into normal live snapshots. */
export function toMarketStoryHistorySnapshots(
  history: MarketStoryHistory[],
  generatedAtMs: number
): MarketStorySnapshot[] {
  return history.map((story) => toPublicStorySnapshot(story, "resolved", generatedAtMs));
}

/** Strips a settled runtime story to the exact public record needed for later history. */
export function toMarketStoryHistory(story: MarketStory): MarketStoryHistory {
  return {
    id: story.id,
    title: story.title,
    target: { ...story.target },
    updates: story.updates
      .filter((update) => update.state === "published")
      .sort((left, right) => left.publishedAt - right.publishedAt || left.id.localeCompare(right.id))
      .map((update) => toHistoryUpdate(update))
  };
}

function toRuntimeStorySnapshot(story: MarketStory, generatedAtMs: number): MarketStorySnapshot[] {
  const publicUpdates = story.updates
    .filter((update) => update.state === "published" && update.publishedAt <= generatedAtMs)
    .map((update) => toHistoryUpdate(update));
  if (publicUpdates.length === 0) return [];
  return [toPublicStorySnapshot({ ...story, updates: publicUpdates }, story.status, generatedAtMs)];
}

function toPublicStorySnapshot(
  story: Pick<MarketStoryHistory, "id" | "title" | "target" | "updates">,
  status: MarketStoryStatus,
  generatedAtMs: number
): MarketStorySnapshot {
  const updates = [...story.updates]
    .sort((left, right) => left.publishedAt - right.publishedAt || left.id.localeCompare(right.id))
    .map((update) => ({
      id: update.id,
      title: update.title,
      summary: update.summary,
      publishedAt: new Date(update.publishedAt).toISOString(),
      ...(update.relatedAssetIds?.length ? { relatedAssetIds: [...update.relatedAssetIds].sort() } : {})
    }));
  return {
    id: story.id,
    title: story.title,
    target: { ...story.target },
    status,
    lifecycle: lifecycleFor(status, story.updates, generatedAtMs),
    updates
  };
}

function isRecentHistoryStory(story: MarketStoryHistory, generatedAtMs: number): boolean {
  const latestPublishedAt = Math.max(...story.updates.map((update) => update.publishedAt));
  return generatedAtMs - latestPublishedAt <= RECENT_STORY_WINDOW_MS;
}

function toHistoryUpdate(update: {
  id: string;
  title: string;
  summary: string;
  publishedAt: number;
  relatedAssetIds?: string[];
}): MarketStoryHistoryUpdate {
  return {
    id: update.id,
    title: update.title,
    summary: update.summary,
    publishedAt: update.publishedAt,
    ...(update.relatedAssetIds?.length ? { relatedAssetIds: [...update.relatedAssetIds].sort() } : {})
  };
}

function lifecycleFor(
  status: MarketStoryStatus,
  updates: Pick<MarketStoryHistoryUpdate, "publishedAt">[],
  generatedAtMs: number
): MarketStoryLifecycle {
  if (status === "developing") return "developing";
  const latestPublishedAt = Math.max(...updates.map((update) => update.publishedAt));
  return generatedAtMs - latestPublishedAt <= RECENT_STORY_WINDOW_MS ? "recent" : "archive";
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
