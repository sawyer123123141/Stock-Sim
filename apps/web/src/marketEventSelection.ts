import type { MarketEventSnapshot } from "../../../packages/shared/src/index";

export interface EventSelectableAsset {
  id: string;
  sector: string;
}

function relevanceForAsset(event: MarketEventSnapshot, asset: EventSelectableAsset): number {
  if (event.target.kind === "asset") return event.target.value === asset.id ? 3 : 0;
  if (event.target.kind === "sector") return event.target.value === asset.sector ? 2 : 0;
  return 1;
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
