import { useState } from "react";
import type { AssetSnapshot } from "../../../../packages/shared/src/index";

export interface MovementStoryProps {
  asset: AssetSnapshot;
}

export function MovementStory({ asset }: MovementStoryProps) {
  const [expanded, setExpanded] = useState(false);
  const strongestReason = asset.reasons[0];
  const summary = strongestReason?.summary
    ?? "No major driver is dominating this move right now.";
  const direction = strongestReason?.direction;
  const cue = direction === "down" ? "↘" : direction === "up" ? "↗" : "•";

  return <section className={`movement-story${expanded ? " is-expanded" : ""}`} aria-labelledby="movement-story-title">
    <button type="button" aria-expanded={expanded} aria-controls="movement-reasons" onClick={() => setExpanded((value) => !value)}>
      <span className="section-kicker" id="movement-story-title">WHY THE MOVE?</span>
      <span className="movement-summary"><i aria-hidden="true">{cue}</i>{summary}</span>
      <span className="movement-context-action">{expanded ? "Less context" : "More context"}</span>
      <b aria-hidden="true">›</b>
    </button>
    {expanded && <div id="movement-reasons" className="movement-reasons">{asset.reasons.length === 0 ? <p>No major driver is dominating this move right now.</p> : asset.reasons.slice(0, 3).map((reason) => <div key={reason.code}><strong>{reason.direction === "up" ? "↑" : "↓"} {reason.label}</strong><span>{reason.strength}</span><p>{reason.summary}</p></div>)}</div>}
  </section>;
}
