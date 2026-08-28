import type { MarketReadSnapshot } from "../../../../packages/shared/src/index";

export interface MarketPulseProps {
  marketRead: MarketReadSnapshot;
}

const riskLabels: Record<MarketReadSnapshot["risk"], string> = {
  low: "Low",
  medium: "Medium",
  high: "High"
};

const pressureLabels: Record<MarketReadSnapshot["pressure"], string> = {
  down: "Downward",
  "slightly-down": "Slightly downward",
  balanced: "Balanced",
  "slightly-up": "Slightly upward",
  up: "Upward"
};

export function MarketPulse({ marketRead }: MarketPulseProps) {
  return (
    <section className="market-pulse" aria-labelledby="market-pulse-title">
      <span className="section-kicker" id="market-pulse-title">MARKET PULSE</span>
      <dl>
        <div>
          <dt>Risk</dt>
          <dd>{riskLabels[marketRead.risk]}</dd>
        </div>
        <div>
          <dt>Short-term pressure</dt>
          <dd>{pressureLabels[marketRead.pressure]}</dd>
        </div>
      </dl>
    </section>
  );
}
