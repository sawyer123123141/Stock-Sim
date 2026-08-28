import type { MarketEventSnapshot } from "../../../../packages/shared/src/index";

export interface NewsStoryProps {
  event: MarketEventSnapshot;
  generatedAt: string;
}

export function NewsStory({ event, generatedAt }: NewsStoryProps) {
  const isDeveloping = Date.parse(generatedAt) < Date.parse(event.reactionStartsAt);

  return (
    <article className="insight-card news-story" aria-labelledby="news-story-title">
      <div className="insight-icon" aria-hidden="true">✦</div>
      <div>
        <span className="section-kicker">MARKET NEWS</span>
        <div className="news-title-line">
          <h2 id="news-story-title">{event.title}</h2>
          {isDeveloping && <span className="news-status">Developing</span>}
        </div>
        <p>{event.summary}</p>
      </div>
    </article>
  );
}
