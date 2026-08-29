import type { AssetSnapshot, MarketStorySnapshot } from "../../../../packages/shared/src/index";
import { isRelatedCompanyStory, selectStoryHistory } from "../marketEventSelection";

export function StoryHistory({ asset, stories }: { asset: AssetSnapshot; stories: MarketStorySnapshot[] }) {
  const history = selectStoryHistory(asset, stories);
  return (
    <section className="asset-detail-panel story-history" id="asset-panel-stories" role="tabpanel" aria-labelledby="asset-tab-stories">
      <span className="section-kicker">STORIES</span>
      <h2>{asset.name} information</h2>
      {history.length === 0 ? <p>No public stories are available for this asset yet.</p> : (
        <div className="story-history-list">
          {history.map((story) => (
            <article key={story.id} className={`story-history-item is-${story.status}`}>
              <div><h3>{story.title}</h3><span>{isRelatedCompanyStory(story, asset) ? "RELATED COMPANY" : story.status === "developing" ? "Developing" : "Resolved"}</span></div>
              <ol>{story.updates.map((update) => <li key={update.id}><strong>{update.title}</strong><p>{update.summary}</p><time dateTime={update.publishedAt}>{new Date(update.publishedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time></li>)}</ol>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
