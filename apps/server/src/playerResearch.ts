import type {
  FocusedStockResearchBrief,
  ResearchObjective,
  ResearchProgressionSnapshot
} from "../../../packages/shared/src/index.js";

export interface PlayerResearchState {
  firstStockPurchaseComplete: boolean;
  activeStockAssetId?: string;
}

const LOCKED_RESEARCH: PlayerResearchState = { firstStockPurchaseComplete: false };

export function normalizePlayerResearchState(value: unknown): PlayerResearchState {
  if (!value || typeof value !== "object") return { ...LOCKED_RESEARCH };
  const candidate = value as Partial<PlayerResearchState>;
  const activeStockAssetId = typeof candidate.activeStockAssetId === "string" && candidate.activeStockAssetId.length > 0
    ? candidate.activeStockAssetId
    : undefined;
  return {
    firstStockPurchaseComplete: candidate.firstStockPurchaseComplete === true,
    ...(activeStockAssetId ? { activeStockAssetId } : {})
  };
}

export function markFirstStockPurchase(value: unknown): PlayerResearchState {
  const state = normalizePlayerResearchState(value);
  return state.firstStockPurchaseComplete ? state : { ...state, firstStockPurchaseComplete: true };
}

export function researchObjective(state: PlayerResearchState): ResearchObjective {
  if (!state.firstStockPurchaseComplete) return "make-first-stock-investment";
  return state.activeStockAssetId ? "broaden-investing" : "choose-research-focus";
}

export function toResearchProgressionSnapshot(
  value: unknown,
  brief?: FocusedStockResearchBrief
): ResearchProgressionSnapshot {
  const state = normalizePlayerResearchState(value);
  return {
    unlocked: state.firstStockPurchaseComplete,
    coverageCapacity: 1,
    objective: researchObjective(state),
    ...(state.activeStockAssetId ? { activeStockAssetId: state.activeStockAssetId } : {}),
    ...(brief ? { brief } : {})
  };
}
