import type { PortfolioPositionSnapshot } from "../../../../packages/shared/src/index";

export interface NextObjectiveProps {
  positions: PortfolioPositionSnapshot[];
}

export function NextObjective({ positions }: NextObjectiveProps) {
  const ownedAssets = positions.filter((position) => position.quantity > 0).length;
  const firstInvestment = ownedAssets === 0;
  const title = firstInvestment ? "Make your first investment" : "Own 2 different assets";
  const current = firstInvestment ? 0 : Math.min(ownedAssets, 2);
  const target = firstInvestment ? 1 : 2;
  const progress = Math.min((current / target) * 100, 100);

  return (
    <article className="insight-card next-objective" aria-labelledby="objective-title">
      <div className="objective-copy">
        <span className="section-kicker">NEXT OBJECTIVE</span>
        <h2 id="objective-title">{title}</h2>
        <p>{current} / {target}</p>
      </div>
      <div
        className="objective-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={target}
        aria-valuenow={current}
        aria-label={`${title}: ${current} of ${target}`}
      >
        <span style={{ width: `${progress}%` }} />
      </div>
    </article>
  );
}
