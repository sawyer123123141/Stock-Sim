import type { MarketEventSnapshot, MarketStorySnapshot } from "../../../packages/shared/src/index";

export interface EventSelectableAsset {
  id: string;
  sector: string;
}

function relevanceForAsset(event: Pick<MarketEventSnapshot, "target">, asset: EventSelectableAsset): number {
  if (event.target.kind === "asset") return event.target.value === asset.id ? 3 : 0;
  if (event.target.kind === "sector") return event.target.value === asset.sector ? 2 : 0;
  return 1;
}

function storyPublicationTime(story: MarketStorySnapshot): string {
  return story.updates.reduce(
    (latest, update) => update.publishedAt > latest ? update.publishedAt : latest,
    ""
  );
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
  let selected: MarketStorySnapshot | null = null;
  let selectedRelevance = 0;

  for (const story of stories) {
    const relevance = relevanceForAsset(story, asset);
    if (relevance === 0) continue;
    if (
      relevance > selectedRelevance
      || (relevance === selectedRelevance && (!selected || storyPublicationTime(story) > storyPublicationTime(selected)))
    ) {
      selected = story;
      selectedRelevance = relevance;
    }
  }

  return selected;
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
