import { AssetRail } from "./components/AssetRail";
import { MarketHeader } from "./components/MarketHeader";
import { PriceChart } from "./components/PriceChart";
import { formatMoney, formatSignedPercent } from "./format";
import { useMarketSession } from "./useMarketSession";

export function App() {
  const session = useMarketSession();

  if (session.loading) {
    return (
      <main className="app-shell is-centered">
        <section className="state-card" aria-live="polite">
          <span className="loading-orbit" aria-hidden="true" />
          <p className="section-kicker">MARKET ERA</p>
          <h1>Connecting to the live market</h1>
          <p>Loading authoritative prices and your fictional portfolio.</p>
        </section>
      </main>
    );
  }

  if (session.error || !session.market || !session.portfolio || !session.selectedAsset) {
    return (
      <main className="app-shell is-centered">
        <section className="state-card error-card" role="alert">
          <p className="section-kicker">CONNECTION ISSUE</p>
          <h1>The market did not load.</h1>
          <p>{session.error ?? "The live market returned incomplete data."}</p>
        </section>
      </main>
    );
  }

  const asset = session.selectedAsset;
  const positive = asset.lastTickChangePct >= 0;

  return (
    <main className="app-shell">
      <MarketHeader totalValue={session.portfolio.totalValue} cash={session.portfolio.cash} />

      {session.connectionNotice && (
        <div className="connection-notice" role="status">{session.connectionNotice}</div>
      )}

      <div className="market-workspace">
        <AssetRail
          assets={session.market.assets}
          selectedAssetId={session.selectedAssetId}
          onSelect={session.selectAsset}
        />

        <section className="asset-surface" aria-labelledby="asset-title">
          <div className="asset-heading">
            <div className="company-identity">
              <div className="company-mark" aria-hidden="true">{asset.symbol.slice(0, 1)}</div>
              <div>
                <div className="asset-title-line">
                  <h1 id="asset-title">{asset.name}</h1>
                  <span className="ticker-pill">{asset.symbol}</span>
                </div>
                <p>{asset.kind === "stock" ? "Fictional company" : "Fictional digital asset"}</p>
              </div>
            </div>

            <div className="quote-block">
              <strong>{formatMoney(asset.price)}</strong>
              <span className={positive ? "market-up" : "market-down"}>
                {formatSignedPercent(asset.lastTickChangePct)} <small>latest move</small>
              </span>
            </div>
          </div>

          <div className="timeframe-row" aria-label="Chart timeframe">
            <button type="button" className="timeframe-button is-active" aria-pressed="true">LIVE</button>
            <span>Session data only</span>
          </div>

          <PriceChart asset={asset} samples={session.selectedHistory} />
        </section>
      </div>
    </main>
  );
}
