import type {
  CompanyRelationshipKind,
  ExpectationResearchLevel,
  CompanyResearchLevel,
  StockResearchSnapshot
} from "./market.js";

export type ResearchObjective =
  | "make-first-stock-investment"
  | "choose-research-focus"
  | "broaden-investing";

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
  objective: ResearchObjective;
  activeStockAssetId?: string;
  brief?: FocusedStockResearchBrief;
}

export type StockResearchLabels = StockResearchSnapshot;
