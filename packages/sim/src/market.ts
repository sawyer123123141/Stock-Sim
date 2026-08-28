import type { MarketEvent, MarketEventSnapshot, MarketPressure, MarketSnapshot, MarketState } from "../../shared/src/index.js";
import { combinedEventEffect } from "./events.js";
import type { RandomSource } from "./rng.js";
import { tickAsset } from "./tick.js";

export type PressureByAsset = Readonly<Record<string, MarketPressure | undefined>>;

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

export function toMarketSnapshot(state: MarketState, generatedAtMs: number): MarketSnapshot {
  return {
    sequence: state.sequence,
    generatedAt: new Date(generatedAtMs).toISOString(),
    assets: state.assets.map(({ id, symbol, name, kind, sector, price, lastTickChangePct, reasons }) => ({
      id,
      symbol,
      name,
      kind,
      sector,
      price,
      lastTickChangePct,
      reasons
    })),
    events: state.activeEvents
      .filter((event) => event.publishedAt <= generatedAtMs && event.expiresAt > generatedAtMs)
      .map(toMarketEventSnapshot)
  };
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
