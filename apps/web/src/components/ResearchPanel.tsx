import type { AssetSnapshot, CompanyResearchLevel, ExpectationResearchLevel } from "../../../../packages/shared/src/index";

const companyCopy: Record<keyof NonNullable<AssetSnapshot["research"]>["company"], Record<CompanyResearchLevel, string>> = {
  growth: { challenged: "Growth outlook is challenged", mixed: "Growth outlook is mixed", solid: "Growth outlook is solid", strong: "Growth outlook is strong" },
  profitability: { challenged: "Profitability is under pressure", mixed: "Profitability remains mixed", solid: "Profitability appears solid", strong: "Profitability is strong" },
  financialHealth: { challenged: "Financial health looks strained", mixed: "Financial health is mixed", solid: "Financial health appears stable", strong: "Financial health is strong" },
  competitivePosition: { challenged: "Competitive position looks challenged", mixed: "Competitive position is mixed", solid: "Competitive position is solid", strong: "Competitive position is strong" },
  reputation: { challenged: "Confidence in the company is weak", mixed: "Confidence in the company is mixed", solid: "Confidence in the company is solid", strong: "Confidence in the company is strong" }
};
const expectationCopy: Record<keyof NonNullable<AssetSnapshot["research"]>["expectations"], Record<ExpectationResearchLevel, string>> = {
  growth: { cautious: "Investors remain cautious on growth", balanced: "Growth expectations are balanced", constructive: "Investors expect constructive growth", high: "Growth expectations are high" },
  profitability: { cautious: "Investors remain cautious on profitability", balanced: "Profitability expectations are balanced", constructive: "Investors expect constructive profitability", high: "Profitability expectations are high" },
  demand: { cautious: "Investors remain cautious on demand", balanced: "Demand expectations are balanced", constructive: "Investors expect constructive demand", high: "Investors expect strong demand" },
  execution: { cautious: "Investors remain cautious on execution", balanced: "Execution expectations are balanced", constructive: "Investors expect constructive execution", high: "Execution expectations are high" }
};

export function ResearchPanel({ asset }: { asset: AssetSnapshot }) {
  const research = asset.research;
  if (!research) return null;
  return (
    <section className="asset-detail-panel research-panel" id="asset-panel-research" role="tabpanel" aria-labelledby="asset-tab-research">
      <div><span className="section-kicker">RESEARCH</span><h2>{asset.name}</h2></div>
      <div className="research-section"><h3>Company outlook</h3>{Object.entries(research.company).map(([key, value]) => <div className="research-row" key={key}><strong>{key.replace(/([A-Z])/g, " $1")}</strong><span>{companyCopy[key as keyof typeof companyCopy][value]}</span></div>)}</div>
      <div className="research-section"><h3>Market expectations</h3>{Object.entries(research.expectations).map(([key, value]) => <div className="research-row" key={key}><strong>{key}</strong><span>{expectationCopy[key as keyof typeof expectationCopy][value]}</span></div>)}</div>
    </section>
  );
}
