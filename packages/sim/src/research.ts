import type {
  AssetState,
  CompanyResearchLevel,
  ExpectationResearchLevel,
  FocusedStockResearchBrief,
  StockResearchSnapshot
} from "../../shared/src/index.js";
import { companyRelationshipSnapshots } from "./companyRelationships.js";

const LOWER_BOUND = -0.35;
const UPPER_BOUND = 0.2;
const STRONG_BOUND = 0.55;

export function classifyCompanyResearch(value: number): CompanyResearchLevel {
  if (value < LOWER_BOUND) return "challenged";
  if (value < UPPER_BOUND) return "mixed";
  if (value < STRONG_BOUND) return "solid";
  return "strong";
}

export function classifyExpectationResearch(value: number): ExpectationResearchLevel {
  if (value < LOWER_BOUND) return "cautious";
  if (value < UPPER_BOUND) return "balanced";
  if (value < STRONG_BOUND) return "constructive";
  return "high";
}

/** Projects broad stock research labels without exposing normalized state. */
export function toStockResearchSnapshot(asset: AssetState): StockResearchSnapshot | undefined {
  if (asset.kind !== "stock" || !asset.fundamentals || !asset.expectations) return undefined;
  return {
    company: {
      growth: classifyCompanyResearch(asset.fundamentals.growth),
      profitability: classifyCompanyResearch(asset.fundamentals.profitability),
      financialHealth: classifyCompanyResearch(asset.fundamentals.financialHealth),
      competitivePosition: classifyCompanyResearch(asset.fundamentals.competitivePosition),
      reputation: classifyCompanyResearch(asset.fundamentals.reputation)
    },
    expectations: {
      growth: classifyExpectationResearch(asset.expectations.growth),
      profitability: classifyExpectationResearch(asset.expectations.profitability),
      demand: classifyExpectationResearch(asset.expectations.demand),
      execution: classifyExpectationResearch(asset.expectations.execution)
    }
  };
}

const relationshipContextCopy = {
  supplier: "Public supplier developments can shape expectations around execution and growth.",
  customer: "Public customer demand can shape expectations around demand and growth.",
  partner: "Public partner developments can shape expectations around execution and growth.",
  competitor: "Public competitor developments can shape expectations around demand."
} as const;

/** Projects one focused stock's broad research brief from current private runtime state. */
export function toFocusedStockResearchBrief(
  asset: AssetState,
  assets: AssetState[]
): FocusedStockResearchBrief | undefined {
  const research = toStockResearchSnapshot(asset);
  if (!research) return undefined;
  return {
    assetId: asset.id,
    company: research.company,
    expectations: research.expectations,
    context: companyRelationshipSnapshots(asset, assets).map((relationship) => ({
      assetId: relationship.assetId,
      name: relationship.name,
      kind: relationship.kind,
      summary: relationshipContextCopy[relationship.kind]
    }))
  };
}
