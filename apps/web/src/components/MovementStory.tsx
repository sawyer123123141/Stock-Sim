import type { AssetSnapshot } from "../../../../packages/shared/src/index";

export interface MovementStoryProps {
  asset: AssetSnapshot;
}

export function MovementStory({ asset }: MovementStoryProps) {
  const strongestReason = asset.reasons[0];
  const summary = strongestReason?.summary
    ?? "No major driver is dominating this move right now.";
  const direction = strongestReason?.direction;
  const cue = direction === "down" ? "↘" : direction === "up" ? "↗" : "•";

  return (
    <article className="insight-card movement-story" aria-labelledby="movement-story-title">
      <div className="insight-icon" aria-hidden="true">{cue}</div>
      <div>
        <span className="section-kicker">WHY IT MOVED</span>
        <h2 id="movement-story-title">Why {asset.symbol} moved</h2>
        <p>{summary}</p>
      </div>
    </article>
  );
}
