import type { PlayerProgressionStage, ResearchObjective } from "../../../packages/shared/src/index.js";

export interface PlayerEarlyProgressionState {
  independentInvestorComplete: boolean;
}

export interface ProgressionFacts {
  firstStockPurchaseComplete: boolean;
  hasValidFocus: boolean;
  distinctPositiveStockCount: number;
}

export interface PlayerProgressionProjection {
  stage: PlayerProgressionStage;
  onboardingComplete: boolean;
  objective?: ResearchObjective;
}

const INCOMPLETE: PlayerEarlyProgressionState = { independentInvestorComplete: false };

export function normalizePlayerEarlyProgressionState(value: unknown): PlayerEarlyProgressionState {
  if (!value || typeof value !== "object") return { ...INCOMPLETE };
  return {
    independentInvestorComplete: (value as Partial<PlayerEarlyProgressionState>).independentInvestorComplete === true
  };
}

export function reconcileEarlyProgression(
  value: unknown,
  facts: ProgressionFacts
): PlayerEarlyProgressionState {
  const state = normalizePlayerEarlyProgressionState(value);
  if (state.independentInvestorComplete) return state;
  return facts.firstStockPurchaseComplete
    && facts.hasValidFocus
    && facts.distinctPositiveStockCount >= 2
    ? { independentInvestorComplete: true }
    : state;
}

export function projectPlayerProgression(
  value: unknown,
  facts: ProgressionFacts
): PlayerProgressionProjection {
  const state = reconcileEarlyProgression(value, facts);
  if (!facts.firstStockPurchaseComplete) {
    return { stage: "new-investor", onboardingComplete: false, objective: "make-first-stock-investment" };
  }
  if (!facts.hasValidFocus) {
    return { stage: "new-investor", onboardingComplete: false, objective: "choose-research-focus" };
  }
  if (!state.independentInvestorComplete) {
    return { stage: "new-investor", onboardingComplete: false, objective: "build-small-stock-portfolio" };
  }
  return { stage: "independent-investor", onboardingComplete: true };
}
