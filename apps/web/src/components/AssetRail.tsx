import type { AssetSnapshot } from "../../../../packages/shared/src/index";
import { formatMoney, formatSignedPercent } from "../format";

export interface AssetRailProps {
  assets: AssetSnapshot[];
  selectedAssetId: string;
  onSelect(assetId: string): void;
}

export function AssetRail({ assets, selectedAssetId, onSelect }: AssetRailProps) {
  return (
    <nav className="asset-rail" aria-label="Available market assets">
      <div className="asset-rail-heading">
        <span className="section-kicker">MARKET</span>
        <span className="asset-count">{Math.min(assets.length, 5)} assets</span>
      </div>
      <div className="asset-list">
        {assets.slice(0, 5).map((asset) => {
          const selected = asset.id === selectedAssetId;
          const positive = asset.lastTickChangePct >= 0;
          return (
            <button
              key={asset.id}
              type="button"
              className={`asset-button ${selected ? "is-selected" : ""}`}
              aria-pressed={selected}
              onClick={() => onSelect(asset.id)}
            >
              <span className="asset-icon" aria-hidden="true">{asset.symbol.slice(0, 1)}</span>
              <span className="asset-button-copy">
                <span className="asset-symbol-line">
                  <strong>{asset.symbol}</strong>
                  <span className={positive ? "market-up" : "market-down"}>
                    {formatSignedPercent(asset.lastTickChangePct)}
                  </span>
                </span>
                <span className="asset-name">{asset.name}</span>
                <span className="asset-price">{formatMoney(asset.price)}</span>
              </span>
              <span className="asset-chevron" aria-hidden="true">›</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
