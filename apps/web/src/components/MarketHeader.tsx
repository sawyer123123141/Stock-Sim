import { formatMoney } from "../format";
import type { PlayerProgressionStage, ResearchObjective } from "../../../../packages/shared/src/index";

export interface MarketHeaderProps {
  totalValue: number;
  cash: number;
  objective: ResearchObjective;
  onboardingComplete: boolean;
  stage: PlayerProgressionStage;
}

const objectiveCopy: Record<ResearchObjective, string> = {
  "make-first-stock-investment": "Make your first stock investment",
  "choose-research-focus": "Choose a company to research",
  "build-small-stock-portfolio": "Build a small stock portfolio"
};

const stageCopy: Record<PlayerProgressionStage, string> = {
  "new-investor": "New Investor",
  "independent-investor": "Independent Investor"
};

export function MarketHeader({ totalValue, cash, objective, onboardingComplete, stage }: MarketHeaderProps) {
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
        {onboardingComplete ? (
          <div className="objective-chip objective-chip-stage" aria-label="Investor stage">
            <span>INVESTOR STAGE</span>
            <strong>{stageCopy[stage]}</strong>
          </div>
        ) : (
          <div className="objective-chip" aria-label="Next objective">
            <span>NEXT OBJECTIVE</span>
            <strong>{objectiveCopy[objective]}</strong>
          </div>
        )}
        <div className="account-stat">
          <span>Cash</span>
          <strong>{formatMoney(cash)}</strong>
        </div>
      </div>
    </header>
  );
}
