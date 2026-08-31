import type {
  ResearchFocusIntent,
  ResearchProgressionSnapshot
} from "../../../packages/shared/src/index.js";
import type { MarketRuntime } from "./marketRuntime.js";
import { normalizePlayerResearchState, toResearchProgressionSnapshot } from "./playerResearch.js";
import type { PortfolioStore } from "./portfolioStore.js";

export type ResearchErrorCode = "RESEARCH_LOCKED" | "RESEARCH_ASSET_NOT_FOUND" | "RESEARCH_STOCK_REQUIRED" | "INVALID_RESEARCH_FOCUS";

export class ResearchError extends Error {
  constructor(public readonly code: ResearchErrorCode, message: string) {
    super(message);
    this.name = "ResearchError";
  }
}

export interface ResearchService {
  getResearch(playerId: string): Promise<ResearchProgressionSnapshot>;
  setFocus(playerId: string, intent: ResearchFocusIntent): Promise<ResearchProgressionSnapshot>;
}

interface ResolvedResearchState {
  state: ReturnType<typeof normalizePlayerResearchState>;
  brief?: NonNullable<ReturnType<MarketRuntime["researchBriefForAsset"]>>;
}

function resolveResearchState(value: unknown, runtime: MarketRuntime): ResolvedResearchState {
  const state = normalizePlayerResearchState(value);
  if (!state.activeStockAssetId) return { state };
  const brief = runtime.researchBriefForAsset(state.activeStockAssetId);
  if (brief) return { state, brief };
  return {
    state: { firstStockPurchaseComplete: true }
  };
}

export function createResearchService(options: {
  runtime: MarketRuntime;
  store: PortfolioStore;
}): ResearchService {
  async function getResearch(playerId: string): Promise<ResearchProgressionSnapshot> {
    return options.store.transact(playerId, (portfolio) => {
      const resolved = resolveResearchState(portfolio.research, options.runtime);
      portfolio.research = resolved.state;
      return toResearchProgressionSnapshot(resolved.state, resolved.brief);
    });
  }

  async function setFocus(
    playerId: string,
    intent: ResearchFocusIntent
  ): Promise<ResearchProgressionSnapshot> {
    if (!intent || typeof intent !== "object" || typeof intent.assetId !== "string" || intent.assetId.length === 0) {
      throw new ResearchError("INVALID_RESEARCH_FOCUS", "A stock asset ID is required.");
    }
    return options.store.transact(playerId, (portfolio) => {
      const research = resolveResearchState(portfolio.research, options.runtime).state;
      if (!research.firstStockPurchaseComplete) {
        throw new ResearchError("RESEARCH_LOCKED", "Research is not unlocked yet.");
      }
      const asset = options.runtime.snapshot().assets.find((candidate) => candidate.id === intent.assetId);
      if (!asset) throw new ResearchError("RESEARCH_ASSET_NOT_FOUND", "Research asset not found.");
      if (asset.kind !== "stock") {
        throw new ResearchError("RESEARCH_STOCK_REQUIRED", "Research Focus is available for stocks only.");
      }
      const brief = options.runtime.researchBriefForAsset(asset.id);
      if (!brief) throw new ResearchError("RESEARCH_STOCK_REQUIRED", "Research is unavailable for this stock.");
      const next = { ...research, activeStockAssetId: asset.id };
      portfolio.research = next;
      return toResearchProgressionSnapshot(next, brief);
    });
  }

  return { getResearch, setFocus };
}
