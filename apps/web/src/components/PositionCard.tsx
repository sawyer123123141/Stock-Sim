import type {
  AssetSnapshot,
  PortfolioPositionSnapshot
} from "../../../../packages/shared/src/index";
import { formatMoney } from "../format";

export interface PositionCardProps {
  asset: AssetSnapshot;
  position: PortfolioPositionSnapshot | null;
}

export function PositionCard({ asset, position }: PositionCardProps) {
  if (!position) {
    return (
      <section className="position-card panel-card" aria-labelledby="position-title">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">YOUR POSITION</span>
            <h2 id="position-title">Not owned yet</h2>
          </div>
        </div>
        <p className="empty-position">
          You do not own {asset.symbol}. Buying at least one unit will create a position here.
        </p>
      </section>
    );
  }

  const positive = position.unrealizedPnL >= 0;

  return (
    <section className="position-card panel-card is-updated" aria-labelledby="position-title">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">YOUR POSITION</span>
          <h2 id="position-title">{position.quantity} {position.quantity === 1 ? "unit" : "units"}</h2>
        </div>
        <span className={positive ? "market-up" : "market-down"}>
          {positive ? "+" : ""}{formatMoney(position.unrealizedPnL)}
        </span>
      </div>

      <dl className="position-metrics">
        <div>
          <dt>Average cost</dt>
          <dd>{formatMoney(position.averageCost)}</dd>
        </div>
        <div>
          <dt>Market value</dt>
          <dd>{formatMoney(position.marketValue)}</dd>
        </div>
        <div>
          <dt>Unrealized</dt>
          <dd className={positive ? "market-up" : "market-down"}>
            {positive ? "+" : ""}{formatMoney(position.unrealizedPnL)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
