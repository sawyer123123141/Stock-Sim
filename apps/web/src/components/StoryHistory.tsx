import { useEffect, useMemo, useState } from "react";
import type { AssetSnapshot, MarketStorySnapshot } from "../../../../packages/shared/src/index";
import { fetchStoryHistory } from "../api";
import { isRelatedCompanyStory, selectStoryLifecycleGroups } from "../marketEventSelection";

export function StoryHistory({ asset, stories }: { asset: AssetSnapshot; stories: MarketStorySnapshot[] }) {
  const [archive, setArchive] = useState<MarketStorySnapshot[]>([]);
  const [archiveError, setArchiveError] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    setArchive([]);
    setArchiveError(false);
    setNextCursor(undefined);
    void fetchStoryHistory(asset.id)
      .then((page) => {
        if (!cancelled) {
          setArchive(page.stories);
          setNextCursor(page.nextCursor);
        }
      })
      .catch(() => {
        if (!cancelled) setArchiveError(true);
      });
    return () => { cancelled = true; };
  }, [asset.id]);

  const groups = useMemo(() => {
    const byId = new Map(stories.map((story) => [story.id, story]));
    for (const story of archive) if (!byId.has(story.id)) byId.set(story.id, story);
    return selectStoryLifecycleGroups(asset, [...byId.values()]);
  }, [archive, asset, stories]);
  const hasStories = groups.developing.length + groups.recent.length + groups.archive.length > 0;

  const loadOlder = () => {
    if (!nextCursor) return;
    void fetchStoryHistory(asset.id, nextCursor)
      .then((page) => {
        setArchive((previous) => [...previous, ...page.stories.filter((story) => !previous.some((current) => current.id === story.id))]);
        setNextCursor(page.nextCursor);
      })
      .catch(() => setArchiveError(true));
  };

  return (
    <section className="asset-detail-panel story-history" id="asset-panel-stories" role="tabpanel" aria-labelledby="asset-tab-stories">
      <span className="section-kicker">STORIES</span>
      <h2>{asset.name} information</h2>
      {!hasStories ? <p>No public stories are available for this asset yet.</p> : (
        <div className="story-history-groups">
          <StoryGroup title="DEVELOPING" stories={groups.developing} asset={asset} />
          <StoryGroup title="RECENT" stories={groups.recent} asset={asset} />
          <StoryGroup title="ARCHIVE" stories={groups.archive} asset={asset} />
        </div>
      )}
      {nextCursor && <button type="button" className="story-history-more" onClick={loadOlder}>Load older stories</button>}
      {archiveError && <p className="story-history-note" role="status">Older public history could not load right now.</p>}
    </section>
  );
}

function StoryGroup({ title, stories, asset }: { title: string; stories: MarketStorySnapshot[]; asset: AssetSnapshot }) {
  if (stories.length === 0) return null;
  return (
    <section className="story-history-group" aria-label={`${title.toLowerCase()} stories`}>
      <span className="section-kicker">{title}</span>
      <div className="story-history-list">
        {stories.map((story) => (
            <article key={story.id} className={`story-history-item is-${story.status}`}>
              <div><h3>{story.title}</h3><span>{isRelatedCompanyStory(story, asset) ? "RELATED COMPANY" : story.status === "developing" ? "Developing" : "Resolved"}</span></div>
              <ol>{story.updates.map((update) => <li key={update.id}><strong>{update.title}</strong><p>{update.summary}</p><time dateTime={update.publishedAt}>{new Date(update.publishedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time></li>)}</ol>
            </article>
        ))}
      </div>
    </section>
  );
}
