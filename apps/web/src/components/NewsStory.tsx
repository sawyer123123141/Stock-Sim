import type { MarketStorySnapshot } from "../../../../packages/shared/src/index";

export interface NewsStoryProps {
  story: MarketStorySnapshot;
  generatedAt: string;
}

function relativeTime(publishedAt: string, generatedAt: string): string {
  const elapsedSeconds = Math.max(0, Math.floor((Date.parse(generatedAt) - Date.parse(publishedAt)) / 1_000));
  if (elapsedSeconds < 60) return "Just now";
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  return `${elapsedMinutes} minute${elapsedMinutes === 1 ? "" : "s"} ago`;
}

export function NewsStory({ story, generatedAt }: NewsStoryProps) {
  const isDeveloping = story.status === "developing";
  const latest = story.updates.at(-1);
  const compact = story.updates.length <= 1;

  return (
    <article className={`insight-card developing-story${isDeveloping ? " is-developing" : " is-resolved"}`} aria-labelledby="news-story-title">
      <div className="insight-icon" aria-hidden="true">✦</div>
      <div>
        <span className="section-kicker">{isDeveloping ? "DEVELOPING STORY" : "RECENT STORY"}</span>
        <div className="news-title-line">
          <h2 id="news-story-title">{story.title}</h2>
          <span className="news-status">{isDeveloping ? "Developing" : "Resolved"}</span>
        </div>
        {compact && latest && (
          <div className="story-latest">
            <h3>{latest.title}</h3>
            <p>{latest.summary}</p>
          </div>
        )}
        {!compact && (
          <ol className="story-timeline">
            {story.updates.map((update, index) => (
              <li key={update.id} className={index === story.updates.length - 1 ? "is-latest" : ""}>
                <span className="story-timeline-dot" aria-hidden="true" />
                <div>
                  <h3>{update.title}</h3>
                  <p>{update.summary}</p>
                  <time dateTime={update.publishedAt}>{relativeTime(update.publishedAt, generatedAt)}</time>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </article>
  );
}
