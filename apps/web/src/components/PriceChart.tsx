import type { AssetSnapshot } from "../../../../packages/shared/src/index";
import { formatMoney } from "../format";
import type { PriceSample } from "../useMarketSession";

export interface PriceChartProps {
  asset: AssetSnapshot;
  samples: PriceSample[];
}

const WIDTH = 800;
const HEIGHT = 360;
const PAD_X = 28;
const PAD_Y = 32;

function chartPoints(asset: AssetSnapshot, samples: PriceSample[]): PriceSample[] {
  if (samples.length >= 2) return samples;
  if (samples.length === 1) {
    return [samples[0], { atMs: samples[0].atMs + 1, price: asset.price }];
  }
  return [
    { atMs: 0, price: asset.price },
    { atMs: 1, price: asset.price }
  ];
}

export function PriceChart({ asset, samples }: PriceChartProps) {
  const points = chartPoints(asset, samples);
  const prices = points.map((point) => point.price);
  const rawMin = Math.min(...prices);
  const rawMax = Math.max(...prices);
  const rawRange = rawMax - rawMin;
  const padding = rawRange > 0 ? rawRange * 0.12 : Math.max(asset.price * 0.006, 0.01);
  const min = rawMin - padding;
  const max = rawMax + padding;
  const range = Math.max(max - min, 0.01);
  const drawableWidth = WIDTH - PAD_X * 2;
  const drawableHeight = HEIGHT - PAD_Y * 2;

  const path = points.map((point, index) => {
    const x = PAD_X + (index / Math.max(points.length - 1, 1)) * drawableWidth;
    const y = PAD_Y + ((max - point.price) / range) * drawableHeight;
    return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");

  const positive = asset.lastTickChangePct >= 0;
  const label = `${asset.name} live session chart. Current price ${formatMoney(asset.price)}.`;

  return (
    <figure className={`price-chart ${positive ? "is-positive" : "is-negative"}`}>
      <div className="chart-meta" aria-hidden="true">
        <span>LIVE SESSION</span>
        <span>{samples.length <= 1 ? "Collecting live history…" : `${samples.length} updates`}</span>
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
        <path className="chart-line" d={path} fill="none" vectorEffect="non-scaling-stroke" />
        <circle
          className="chart-dot"
          cx={WIDTH - PAD_X}
          cy={PAD_Y + ((max - points[points.length - 1].price) / range) * drawableHeight}
          r="5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="chart-range" aria-hidden="true">
        <span>{formatMoney(max)}</span>
        <span>{formatMoney(min)}</span>
      </div>
    </figure>
  );
}
