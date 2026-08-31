import type {
  FocusedStockResearchBrief,
  PlayerProgressionStage,
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
  const firstStockPurchaseComplete = candidate.firstStockPurchaseComplete === true;
  if (!firstStockPurchaseComplete) return { ...LOCKED_RESEARCH };
  const activeStockAssetId = typeof candidate.activeStockAssetId === "string" && candidate.activeStockAssetId.length > 0
    ? candidate.activeStockAssetId
    : undefined;
  return {
    firstStockPurchaseComplete,
    ...(activeStockAssetId ? { activeStockAssetId } : {})
  };
}

export function markFirstStockPurchase(value: unknown): PlayerResearchState {
  const state = normalizePlayerResearchState(value);
  return state.firstStockPurchaseComplete ? state : { ...state, firstStockPurchaseComplete: true };
}

export function toResearchProgressionSnapshot(
  value: unknown,
  brief: FocusedStockResearchBrief | undefined,
  progression: {
    stage: PlayerProgressionStage;
    onboardingComplete: boolean;
    objective?: ResearchObjective;
  }
): ResearchProgressionSnapshot {
  const state = normalizePlayerResearchState(value);
  const hasValidFocus = state.activeStockAssetId !== undefined && brief?.assetId === state.activeStockAssetId;
  return {
    unlocked: state.firstStockPurchaseComplete,
    coverageCapacity: 1,
    stage: progression.stage,
    onboardingComplete: progression.onboardingComplete,
    ...(progression.objective ? { objective: progression.objective } : {}),
    ...(hasValidFocus && state.activeStockAssetId ? { activeStockAssetId: state.activeStockAssetId } : {}),
    ...(hasValidFocus && brief ? { brief } : {})
  };
}
