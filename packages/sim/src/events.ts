import type { AssetState, MarketEvent } from "../../shared/src/index.js";
import { clamp } from "./math.js";

function eventMatchesAsset(event: MarketEvent, asset: AssetState): boolean {
  if (event.target.kind === "global") return true;
  if (event.target.kind === "asset") return event.target.value === asset.id;
  return event.target.value === asset.sector;
}

export function eventEffectForAsset(event: MarketEvent, asset: AssetState, nowMs: number): number {
  if (!eventMatchesAsset(event, asset)) return 0;
  if (nowMs < event.startsAt || nowMs >= event.expiresAt) return 0;
  if (event.expiresAt <= event.startsAt) return 0;

  const progress = (nowMs - event.startsAt) / (event.expiresAt - event.startsAt);
  const remaining = 1 - clamp(progress, 0, 1);
  return clamp(event.effect, -1, 1) * remaining;
}

export function combinedEventEffect(events: MarketEvent[], asset: AssetState, nowMs: number): number {
  return clamp(events.reduce((sum, event) => sum + eventEffectForAsset(event, asset, nowMs), 0), -1, 1);
}
