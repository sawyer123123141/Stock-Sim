import type { MarketStoryUpdateSnapshot } from "../../../packages/shared/src/index";

export interface ChartPriceSample {
  atMs: number;
}

export interface ChartStoryMarker {
  update: MarketStoryUpdateSnapshot;
  /** Normalized horizontal position inside the actual visible sample range. */
  x: number;
}

interface ChartTimeRange {
  firstAtMs: number;
  lastAtMs: number;
}

export interface ChartSamplePosition {
  /** Normalized horizontal position on the chart's shared time axis. */
  x: number;
}

function chartTimeRange(samples: ChartPriceSample[]): ChartTimeRange | null {
  if (samples.length < 2) return null;
  const firstSample = samples[0];
  const lastSample = samples.at(-1);
  if (!firstSample || !lastSample) return null;
  const firstAtMs = firstSample.atMs;
  const lastAtMs = lastSample.atMs;
  if (!Number.isFinite(firstAtMs) || !Number.isFinite(lastAtMs) || lastAtMs <= firstAtMs) return null;
  return { firstAtMs, lastAtMs };
}

function positionForTimestamp(atMs: number, range: ChartTimeRange): number | null {
  if (!Number.isFinite(atMs)) return null;
  return Math.min(1, Math.max(0, (atMs - range.firstAtMs) / (range.lastAtMs - range.firstAtMs)));
}

/**
 * Positions price samples on the same real-time axis as public story markers.
 * Broken or equal endpoint timestamps retain the former even-spacing fallback.
 */
export function selectChartSamplePositions(samples: ChartPriceSample[]): ChartSamplePosition[] {
  const range = chartTimeRange(samples);
  return samples.map((sample, index) => ({
    x: range
      ? positionForTimestamp(sample.atMs, range) ?? index / Math.max(samples.length - 1, 1)
      : index / Math.max(samples.length - 1, 1)
  }));
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
  const range = chartTimeRange(samples);
  if (!range) return [];

  const seen = new Set<string>();
  return updates
    .map((update) => ({ update, atMs: Date.parse(update.publishedAt) }))
    .filter(({ update, atMs }) => {
      if (!Number.isFinite(atMs) || atMs < range.firstAtMs || atMs > range.lastAtMs || seen.has(update.id)) return false;
      seen.add(update.id);
      return true;
    })
    .sort((left, right) => left.atMs - right.atMs || left.update.id.localeCompare(right.update.id))
    .map(({ update, atMs }) => ({ update, x: positionForTimestamp(atMs, range) ?? 0 }));
}
