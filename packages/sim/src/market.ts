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
import { combinedEventEffect } from "./events.js";
import { calculateMarketRead } from "./marketRead.js";
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
    assets: state.assets.map((asset) => tickAsset(
      asset,
      {
        demand: pressureByAsset[asset.id] ?? ZERO_PRESSURE,
        eventEffect: combinedEventEffect(state.activeEvents, asset, nowMs),
        deltaMs
      },
      rng
    ).asset)
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
    assets: state.assets.map((asset) => ({
      id: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      kind: asset.kind,
      sector: asset.sector,
      price: asset.price,
      lastTickChangePct: asset.lastTickChangePct,
      marketRead: marketReadByAsset[asset.id] ?? calculateMarketRead(asset, ZERO_PRESSURE),
      reasons: asset.reasons
    })),
    events: state.activeEvents
      .filter((event) => event.publishedAt <= generatedAtMs && event.expiresAt > generatedAtMs)
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
        publishedAt: new Date(update.publishedAt).toISOString()
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
