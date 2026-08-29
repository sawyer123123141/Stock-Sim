import type { MarketStoryUpdateSnapshot } from "../../../packages/shared/src/index";

export interface ChartPriceSample {
  atMs: number;
}

export interface ChartStoryMarker {
  update: MarketStoryUpdateSnapshot;
  /** Normalized horizontal position inside the actual visible sample range. */
  x: number;
}

/**
 * Selects only public information that belongs inside the real session range.
 * The caller supplies already-relevant public updates; this function never
 * receives a story plan or any hidden simulation state.
 */
export function selectChartStoryMarkers(
  samples: ChartPriceSample[],
  updates: MarketStoryUpdateSnapshot[]
): ChartStoryMarker[] {
  if (samples.length < 2) return [];
  const firstSample = samples[0];
  const lastSample = samples.at(-1);
  if (!firstSample || !lastSample) return [];
  const firstAtMs = firstSample.atMs;
  const lastAtMs = lastSample.atMs;
  if (!Number.isFinite(firstAtMs) || !Number.isFinite(lastAtMs) || lastAtMs <= firstAtMs) return [];

  const seen = new Set<string>();
  return updates
    .map((update) => ({ update, atMs: Date.parse(update.publishedAt) }))
    .filter(({ update, atMs }) => {
      if (!Number.isFinite(atMs) || atMs < firstAtMs || atMs > lastAtMs || seen.has(update.id)) return false;
      seen.add(update.id);
      return true;
    })
    .sort((left, right) => left.atMs - right.atMs || left.update.id.localeCompare(right.update.id))
    .map(({ update, atMs }) => ({ update, x: (atMs - firstAtMs) / (lastAtMs - firstAtMs) }));
}
