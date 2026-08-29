import type { AssetSnapshot } from "../../../../packages/shared/src/index";

export type AssetTab = "overview" | "company" | "research" | "stories";

export interface AssetTabsProps {
  asset: AssetSnapshot;
  selectedTab: AssetTab;
  onSelect: (tab: AssetTab) => void;
}

export function AssetTabs({ asset, selectedTab, onSelect }: AssetTabsProps) {
  const tabs: Array<{ id: AssetTab; label: string }> = asset.kind === "stock"
    ? [
      { id: "overview", label: "Overview" },
      { id: "company", label: "Company" },
      { id: "research", label: "Research" },
      { id: "stories", label: "Stories" }
    ]
    : [
      { id: "overview", label: "Overview" },
      { id: "stories", label: "Stories" }
    ];

  return (
    <div className="asset-tabs" role="tablist" aria-label={`${asset.name} information`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          id={`asset-tab-${tab.id}`}
          type="button"
          role="tab"
          aria-selected={selectedTab === tab.id}
          aria-controls={`asset-panel-${tab.id}`}
          className={selectedTab === tab.id ? "is-active" : ""}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
