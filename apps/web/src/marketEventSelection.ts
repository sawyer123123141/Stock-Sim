import type { MarketEventSnapshot, MarketStorySnapshot, MarketStoryUpdateSnapshot } from "../../../packages/shared/src/index";

export interface EventSelectableAsset {
  id: string;
  sector: string;
}

function relevanceForAsset(event: Pick<MarketEventSnapshot, "target"> & Partial<Pick<MarketStorySnapshot, "updates">>, asset: EventSelectableAsset): number {
  if (event.target.kind === "asset") {
    if (event.target.value === asset.id) return 4;
    return event.updates?.some((update) => update.relatedAssetIds?.includes(asset.id)) ? 3 : 0;
  }
  if (event.target.kind === "sector") return event.target.value === asset.sector ? 2 : 0;
  return 1;
}

export function isRelatedCompanyStory(story: MarketStorySnapshot, asset: EventSelectableAsset): boolean {
  return story.target.kind === "asset"
    && story.target.value !== asset.id
    && story.updates.some((update) => update.relatedAssetIds?.includes(asset.id));
}

function storyPublicationTime(story: MarketStorySnapshot): string {
  return story.updates.reduce(
    (latest, update) => update.publishedAt > latest ? update.publishedAt : latest,
    ""
  );
}

function lifecycleForStory(story: MarketStorySnapshot): "developing" | "recent" | "archive" {
  return story.lifecycle ?? (story.status === "developing" ? "developing" : "recent");
}

export function selectRelevantMarketEvent(
  asset: EventSelectableAsset,
  events: MarketEventSnapshot[]
): MarketEventSnapshot | null {
  let selected: MarketEventSnapshot | null = null;
  let selectedRelevance = 0;

  for (const event of events) {
    const relevance = relevanceForAsset(event, asset);
    if (relevance === 0) continue;
    if (
      relevance > selectedRelevance
      || (relevance === selectedRelevance && (!selected || event.publishedAt > selected.publishedAt))
    ) {
      selected = event;
      selectedRelevance = relevance;
    }
  }

  return selected;
}

export function selectRelevantMarketStory(
  asset: EventSelectableAsset,
  stories: MarketStorySnapshot[]
): MarketStorySnapshot | null {
  const relevant = stories
    .map((story) => ({ story, relevance: relevanceForAsset(story, asset) }))
    .filter((candidate) => candidate.relevance > 0 && lifecycleForStory(candidate.story) !== "archive");
  const developing = relevant.filter((candidate) => candidate.story.status === "developing");
  const candidates = developing.length > 0 ? developing : relevant;

  return candidates
    .sort((left, right) => (
      right.relevance - left.relevance
      || storyPublicationTime(right.story).localeCompare(storyPublicationTime(left.story))
      || left.story.id.localeCompare(right.story.id)
    ))[0]?.story ?? null;
}

export function selectRelevantMarketStories(
  asset: EventSelectableAsset,
  stories: MarketStorySnapshot[]
): MarketStorySnapshot[] {
  return stories
    .map((story) => ({ story, relevance: relevanceForAsset(story, asset) }))
    .filter((candidate) => candidate.relevance > 0)
    .sort((left, right) => (
      right.relevance - left.relevance
      || storyPublicationTime(right.story).localeCompare(storyPublicationTime(left.story))
      || left.story.id.localeCompare(right.story.id)
    ))
    .map((candidate) => candidate.story);
}

/** Chart markers only include public connected-company updates that affected this asset. */
export function selectRelevantMarketStoryUpdates(
  asset: EventSelectableAsset,
  stories: MarketStorySnapshot[]
): MarketStoryUpdateSnapshot[] {
  return selectRelevantMarketStories(asset, stories).flatMap((story) => {
    if (isRelatedCompanyStory(story, asset)) {
      return story.updates.filter((update) => update.relatedAssetIds?.includes(asset.id));
    }
    return story.updates;
  });
}

/** Full public history: developing stories first, then relevance and recency. */
export function selectStoryHistory(
  asset: EventSelectableAsset,
  stories: MarketStorySnapshot[]
): MarketStorySnapshot[] {
  return selectRelevantMarketStories(asset, stories)
    .sort((left, right) => (
      Number(lifecycleForStory(right) === "developing") - Number(lifecycleForStory(left) === "developing")
      || relevanceForAsset(right, asset) - relevanceForAsset(left, asset)
      || storyPublicationTime(right).localeCompare(storyPublicationTime(left))
      || left.id.localeCompare(right.id)
    ));
}

export interface StoryLifecycleGroups {
  developing: MarketStorySnapshot[];
  recent: MarketStorySnapshot[];
  archive: MarketStorySnapshot[];
}

/** Groups already-public relevant stories exactly once for the Stories panel. */
export function selectStoryLifecycleGroups(
  asset: EventSelectableAsset,
  stories: MarketStorySnapshot[]
): StoryLifecycleGroups {
  const groups: StoryLifecycleGroups = { developing: [], recent: [], archive: [] };
  for (const story of selectRelevantMarketStories(asset, stories)) {
    groups[lifecycleForStory(story)].push(story);
  }
  return groups;
}
