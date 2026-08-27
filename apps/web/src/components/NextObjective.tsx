import type { PortfolioPositionSnapshot } from "../../../../packages/shared/src/index";

export interface NextObjectiveProps {
  positions: PortfolioPositionSnapshot[];
}

export function NextObjective({ positions }: NextObjectiveProps) {
  const ownedAssets = positions.filter((position) => position.quantity > 0).length;
  const firstStepsComplete = ownedAssets >= 2;

  let title: string;
  let current: number;
  let target: number;
  let detail: string;

  if (ownedAssets === 0) {
    title = "Make your first investment";
    current = 0;
    target = 1;
    detail = "Buy at least 1 unit of any asset.";
  } else if (!firstStepsComplete) {
    title = "Own 2 different assets";
    current = ownedAssets;
    target = 2;
    detail = "Try a second company or digital asset.";
  } else {
    title = "First steps complete";
    current = 1;
    target = 1;
    detail = "You have opened positions in two different assets.";
  }

  const progress = Math.min((current / target) * 100, 100);

  return (
    <article className="insight-card next-objective" aria-labelledby="objective-title">
      <div className="objective-copy">
        <span className="section-kicker">NEXT OBJECTIVE</span>
        <h2 id="objective-title">{title}</h2>
        <p>{current} / {target}</p>
      </div>
      <p className="objective-detail">{detail}</p>
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
