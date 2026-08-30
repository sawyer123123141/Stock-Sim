import { formatMoney } from "../format";
import type { ResearchObjective } from "../../../../packages/shared/src/index";

export interface MarketHeaderProps {
  totalValue: number;
  cash: number;
  objective: ResearchObjective;
}

const objectiveCopy: Record<ResearchObjective, string> = {
  "make-first-stock-investment": "Make your first stock investment",
  "choose-research-focus": "Choose a company to research",
  "broaden-investing": "Explore more than one investment"
};

export function MarketHeader({ totalValue, cash, objective }: MarketHeaderProps) {
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
        <div className="objective-chip" aria-label="Next objective">
          <span>NEXT OBJECTIVE</span>
          <strong>{objectiveCopy[objective]}</strong>
        </div>
        <div className="account-stat">
          <span>Cash</span>
          <strong>{formatMoney(cash)}</strong>
        </div>
      </div>
    </header>
  );
}
