import { useState } from "react";
import type { AssetSnapshot, MarketStoryUpdateSnapshot } from "../../../../packages/shared/src/index";
import { describeMarketChange, formatMoney, marketChangeTone } from "../format";
import { selectChartSamplePositions, selectChartStoryMarkers } from "../priceChartMarkers";
import type { PriceSample } from "../useMarketSession";

export interface PriceChartProps {
  asset: AssetSnapshot;
  samples: PriceSample[];
  updates: MarketStoryUpdateSnapshot[];
}

const WIDTH = 800;
const HEIGHT = 360;
const PAD_X = 28;
const PAD_Y = 32;

export function PriceChart({ asset, samples, updates }: PriceChartProps) {
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const prices = samples.length > 0 ? samples.map((point) => point.price) : [asset.price];
  const rawMin = Math.min(...prices);
  const rawMax = Math.max(...prices);
  const rawRange = rawMax - rawMin;
  const padding = rawRange > 0 ? rawRange * 0.12 : Math.max(asset.price * 0.006, 0.01);
  const min = rawMin - padding;
  const max = rawMax + padding;
  const range = Math.max(max - min, 0.01);
  const drawableWidth = WIDTH - PAD_X * 2;
  const drawableHeight = HEIGHT - PAD_Y * 2;
  const hasLine = samples.length >= 2;
  const samplePositions = selectChartSamplePositions(samples);
  const markers = selectChartStoryMarkers(samples, updates);
  const activeMarker = markers.find((marker) => marker.update.id === activeMarkerId) ?? null;

  const path = hasLine
    ? samples.map((point, index) => {
      const x = PAD_X + (samplePositions[index]?.x ?? 0) * drawableWidth;
      const y = PAD_Y + ((max - point.price) / range) * drawableHeight;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(" ")
    : "";

  const latest = samples[samples.length - 1];
  const latestX = hasLine
    ? PAD_X + (samplePositions.at(-1)?.x ?? 1) * drawableWidth
    : WIDTH / 2;
  const latestY = latest
    ? PAD_Y + ((max - latest.price) / range) * drawableHeight
    : HEIGHT / 2;
  const marketTone = marketChangeTone(asset.lastTickChangePct);
  const label = `${asset.name} live session price movement. Current price ${formatMoney(asset.price)}, ${describeMarketChange(asset.lastTickChangePct)}.`;

  return (
    <figure className={`price-chart is-${marketTone}`}>
      <div className="chart-meta" aria-hidden="true">
        <span>LIVE SESSION</span>
        <span>{samples.length <= 1 ? "Waiting for the next live update…" : `${samples.length} updates`}</span>
      </div>
      <svg
        className="chart-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={label}
        preserveAspectRatio="none"
      >
        {[0.25, 0.5, 0.75].map((fraction) => {
          const y = PAD_Y + fraction * drawableHeight;
          return (
            <line
              key={fraction}
              className="chart-grid-line"
              x1={PAD_X}
              x2={WIDTH - PAD_X}
              y1={y}
              y2={y}
            />
          );
        })}
        {hasLine && (
          <path className="chart-line" d={path} fill="none" vectorEffect="non-scaling-stroke" />
        )}
        {latest && (
          <circle
            className="chart-dot"
            cx={latestX}
            cy={latestY}
            r="5"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {markers.map((marker) => {
          const x = PAD_X + marker.x * drawableWidth;
          const markerLabel = `Public information: ${marker.update.title}. Published ${marker.update.publishedAt}.`;
          return (
            <g
              key={marker.update.id}
              className="chart-story-marker"
              role="button"
              tabIndex={0}
              aria-label={markerLabel}
              aria-pressed={activeMarkerId === marker.update.id}
              onMouseEnter={() => setActiveMarkerId(marker.update.id)}
              onFocus={() => setActiveMarkerId(marker.update.id)}
              onClick={() => setActiveMarkerId(marker.update.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setActiveMarkerId(marker.update.id);
                }
              }}
            >
              <title>{markerLabel}</title>
              <circle cx={x} cy={PAD_Y + 10} r="4" vectorEffect="non-scaling-stroke" />
            </g>
          );
        })}
      </svg>
      {activeMarker && (
        <figcaption className="chart-marker-detail" role="status">
          <strong>{activeMarker.update.title}</strong>
          <span>{activeMarker.update.publishedAt}</span>
        </figcaption>
      )}
      <div className="chart-range" aria-hidden="true">
        <span>{formatMoney(max)}</span>
        <span>{formatMoney(min)}</span>
      </div>
    </figure>
  );
}
