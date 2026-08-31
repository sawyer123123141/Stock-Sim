import { useState } from "react";
import type {
  AssetSnapshot,
  CompanyResearchLevel,
  ExpectationResearchLevel,
  FocusedStockResearchBrief,
  ResearchProgressionSnapshot
} from "../../../../packages/shared/src/index";

const companyCopy: Record<keyof FocusedStockResearchBrief["company"], Record<CompanyResearchLevel, string>> = {
  growth: { challenged: "Growth outlook is challenged", mixed: "Growth outlook is mixed", solid: "Growth outlook is solid", strong: "Growth outlook is strong" },
  profitability: { challenged: "Profitability is under pressure", mixed: "Profitability remains mixed", solid: "Profitability appears solid", strong: "Profitability is strong" },
  financialHealth: { challenged: "Financial health looks strained", mixed: "Financial health is mixed", solid: "Financial health appears stable", strong: "Financial health is strong" },
  competitivePosition: { challenged: "Competitive position looks challenged", mixed: "Competitive position is mixed", solid: "Competitive position is solid", strong: "Competitive position is strong" },
  reputation: { challenged: "Confidence in the company is weak", mixed: "Confidence in the company is mixed", solid: "Confidence in the company is solid", strong: "Confidence in the company is strong" }
};

const expectationCopy: Record<keyof FocusedStockResearchBrief["expectations"], Record<ExpectationResearchLevel, string>> = {
  growth: { cautious: "Investors remain cautious on growth", balanced: "Growth expectations are balanced", constructive: "Investors expect constructive growth", high: "Growth expectations are high" },
  profitability: { cautious: "Investors remain cautious on profitability", balanced: "Profitability expectations are balanced", constructive: "Investors expect constructive profitability", high: "Profitability expectations are high" },
  demand: { cautious: "Investors remain cautious on demand", balanced: "Demand expectations are balanced", constructive: "Investors expect healthy demand", high: "Investors expect strong demand" },
  execution: { cautious: "Investors remain cautious on execution", balanced: "Execution expectations are balanced", constructive: "Investors expect constructive execution", high: "Execution expectations are high" }
};

export interface ResearchPanelProps {
  asset: AssetSnapshot;
  research: ResearchProgressionSnapshot | null;
  pending: boolean;
  error: string | null;
  focusableAssets: AssetSnapshot[];
  onFocus: (assetId: string) => Promise<ResearchProgressionSnapshot | null>;
}

export function ResearchPanel({ asset, research, pending, error, focusableAssets, onFocus }: ResearchPanelProps) {
  const [choosingFocus, setChoosingFocus] = useState(false);
  const activeName = focusableAssets.find((candidate) => candidate.id === research?.activeStockAssetId)?.name;
  const focused = research?.activeStockAssetId === asset.id && research.brief?.assetId === asset.id;
  const moveFocus = (assetId: string) => {
    setChoosingFocus(false);
    void onFocus(assetId);
  };

  return (
    <section className="asset-detail-panel research-panel" id="asset-panel-research" role="tabpanel" aria-labelledby="asset-tab-research">
      <div><span className="section-kicker">RESEARCH</span><h2>{asset.name}</h2></div>
      {!research && <p className="research-focus-state">Loading your research access…</p>}
      {research && !research.unlocked && <p className="research-focus-state">Research becomes available after your first stock investment.</p>}
      {research?.unlocked && !focused && <div className="research-focus-state">
        <p>One company can receive deeper coverage at a time.</p>
        {activeName && <p>Currently researching {activeName}.</p>}
        <button className="research-focus-action" type="button" disabled={pending} onClick={() => moveFocus(asset.id)}>
          {activeName ? "Move focus to " + asset.name : "Research this company"}
        </button>
      </div>}
      {focused && research.brief && <>
        <div className="research-section"><h3>Company outlook</h3>{Object.entries(research.brief.company).map(([key, value]) => <div className="research-row" key={key}><strong>{key.replace(/([A-Z])/g, " $1")}</strong><span>{companyCopy[key as keyof typeof companyCopy][value]}</span></div>)}</div>
        <div className="research-section"><h3>Market expectations</h3>{Object.entries(research.brief.expectations).map(([key, value]) => <div className="research-row" key={key}><strong>{key}</strong><span>{expectationCopy[key as keyof typeof expectationCopy][value]}</span></div>)}<p className="research-expectation-note">Market expectations describe what investors already anticipate. Good results can still feel ordinary when expectations are high.</p></div>
        <div className="research-section market-connections"><h3>Market connections</h3>{research.brief.context.length > 0 ? research.brief.context.map((connection) => <div className="research-row" key={connection.assetId + "-" + connection.kind}><strong>{connection.name}</strong><span>{connection.summary}</span></div>) : <p className="research-empty">No public business connections are currently listed.</p>}</div>
        <div className="research-focus-state">
          <button className="research-focus-action" type="button" disabled={pending} aria-expanded={choosingFocus} onClick={() => setChoosingFocus((current) => !current)}>Move research focus</button>
          {choosingFocus && <div className="research-focus-options">{focusableAssets.filter((candidate) => candidate.id !== asset.id).map((candidate) => <button type="button" key={candidate.id} disabled={pending} onClick={() => moveFocus(candidate.id)}>{candidate.name}</button>)}</div>}
        </div>
      </>}
      {error && <p className="research-error" role="alert">{error}</p>}
    </section>
  );
}
