import type {
  CompanyRelationshipKind,
  ExpectationResearchLevel,
  CompanyResearchLevel
} from "./market.js";

export type ResearchObjective =
  | "make-first-stock-investment"
  | "choose-research-focus"
  | "build-small-stock-portfolio";

export type PlayerProgressionStage = "new-investor" | "independent-investor";

export interface ResearchFocusIntent {
  assetId: string;
}

export interface ResearchConnectionContextSnapshot {
  assetId: string;
  name: string;
  kind: CompanyRelationshipKind;
  summary: string;
}

export interface FocusedStockResearchBrief {
  assetId: string;
  company: Record<"growth" | "profitability" | "financialHealth" | "competitivePosition" | "reputation", CompanyResearchLevel>;
  expectations: Record<"growth" | "profitability" | "demand" | "execution", ExpectationResearchLevel>;
  context: ResearchConnectionContextSnapshot[];
}

export interface ResearchProgressionSnapshot {
  unlocked: boolean;
  coverageCapacity: 1;
  stage: PlayerProgressionStage;
  onboardingComplete: boolean;
  objective?: ResearchObjective;
  activeStockAssetId?: string;
  brief?: FocusedStockResearchBrief;
}
