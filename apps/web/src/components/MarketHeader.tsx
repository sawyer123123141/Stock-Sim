import { formatMoney } from "../format";

export interface MarketHeaderProps {
  totalValue: number;
  cash: number;
}

export function MarketHeader({ totalValue, cash }: MarketHeaderProps) {
  return (
    <header className="market-header">
      <div className="brand-lockup" aria-label="Market Era">
        <span className="brand-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <div>
          <strong>MARKET ERA</strong>
          <span className="live-status"><i aria-hidden="true" />Market Live</span>
        </div>
      </div>

      <div className="account-strip" aria-label="Portfolio summary">
        <div className="account-stat">
          <span>Portfolio</span>
          <strong>{formatMoney(totalValue)}</strong>
        </div>
        <div className="account-stat">
          <span>Cash</span>
          <strong>{formatMoney(cash)}</strong>
        </div>
      </div>
    </header>
  );
}
