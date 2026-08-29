import type { AssetState, MarketEvent } from "../../shared/src/index.js";
import { clamp } from "./math.js";

const BUILD_PORTION = 0.25;
const FADE_PORTION = 0.3;

function eventMatchesAsset(event: MarketEvent, asset: AssetState): boolean {
  if (event.target.kind === "global") return true;
  if (event.target.kind === "asset") return event.target.value === asset.id;
  return event.target.value === asset.sector;
}

function smoothstep(value: number): number {
  const clamped = clamp(value, 0, 1);
  return clamped * clamped * (3 - 2 * clamped);
}

export function eventEffectForAsset(event: MarketEvent, asset: AssetState, nowMs: number): number {
  if (!eventMatchesAsset(event, asset)) return 0;
  if (nowMs < event.reactionStartsAt || nowMs >= event.expiresAt) return 0;
  if (event.expiresAt <= event.reactionStartsAt) return 0;

  const reactionDuration = event.expiresAt - event.reactionStartsAt;
  const reactionProgress = (nowMs - event.reactionStartsAt) / reactionDuration;
  const build = smoothstep(reactionProgress / BUILD_PORTION);
  const fade = smoothstep((1 - reactionProgress) / FADE_PORTION);
  return clamp(event.effect, -1, 1) * build * fade;
}

export function combinedEventEffect(events: MarketEvent[], asset: AssetState, nowMs: number): number {
  return clamp(events.reduce((sum, event) => sum + eventEffectForAsset(event, asset, nowMs), 0), -1, 1);
}

/** Bounded reactions from another company's already-public information. */
export function combinedRelationshipEventEffect(events: MarketEvent[], asset: AssetState, nowMs: number): number {
  return clamp(
    events.filter((event) => event.relationship).reduce((sum, event) => sum + eventEffectForAsset(event, asset, nowMs), 0),
    -1,
    1
  );
}

export function combinedPrimaryEventEffect(events: MarketEvent[], asset: AssetState, nowMs: number): number {
  return clamp(
    events.filter((event) => !event.relationship).reduce((sum, event) => sum + eventEffectForAsset(event, asset, nowMs), 0),
    -1,
    1
  );
}
