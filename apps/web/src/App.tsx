import { useState } from "react";
import { AssetRail } from "./components/AssetRail";
import { AssetTabs, type AssetTab } from "./components/AssetTabs";
import { CompanyProfile } from "./components/CompanyProfile";
import { MarketHeader } from "./components/MarketHeader";
import { MarketRead } from "./components/MarketRead";
import { MovementStory } from "./components/MovementStory";
import { NewsStory } from "./components/NewsStory";
import { PositionCard } from "./components/PositionCard";
import { PriceChart } from "./components/PriceChart";
import { ResearchPanel } from "./components/ResearchPanel";
import { StoryHistory } from "./components/StoryHistory";
import { TradeTicket } from "./components/TradeTicket";
import {
  describeMarketChange,
  formatMoney,
  formatSignedPercent,
  marketChangeTone
} from "./format";
import { useMarketSession } from "./useMarketSession";
import { selectRelevantMarketStories, selectRelevantMarketStory } from "./marketEventSelection";

export function App() {
  const session = useMarketSession();
  const [selectedTab, setSelectedTab] = useState<AssetTab>("overview");

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
  const position = session.selectedPosition;
  const marketTone = marketChangeTone(asset.lastTickChangePct);
  const marketChange = describeMarketChange(asset.lastTickChangePct);
  const lastFill = session.lastTrade?.assetId === asset.id ? session.lastTrade : null;
  const selectedStory = selectRelevantMarketStory(asset, session.market.stories);
  const relevantStoryUpdates = selectRelevantMarketStories(asset, session.market.stories)
    .flatMap((story) => story.updates);

  return (
    <main className="app-shell">
      <MarketHeader totalValue={session.portfolio.totalValue} cash={session.portfolio.cash} ownedAssetCount={session.firstSessionOwnedAssetCount} />

      {session.connectionNotice && (
        <div className="connection-notice" role="status">{session.connectionNotice}</div>
      )}

      <div className="market-workspace">
        <AssetRail
          assets={session.market.assets}
          selectedAssetId={session.selectedAssetId}
          onSelect={(assetId) => { session.selectAsset(assetId); setSelectedTab("overview"); }}
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
              <strong
                key={`${asset.id}-${session.market.sequence}`}
                className="quote-tick"
              >
                {formatMoney(asset.price)}
              </strong>
              <span className={`market-${marketTone}`} aria-label={`Latest move: ${marketChange}`}>
                {formatSignedPercent(asset.lastTickChangePct)} <small>latest move</small>
              </span>
            </div>
          </div>

          <AssetTabs asset={asset} selectedTab={selectedTab} onSelect={setSelectedTab} />

          {selectedTab === "overview" && <section id="asset-panel-overview" role="tabpanel" aria-labelledby="asset-tab-overview" className="overview-panel">
            <MarketRead marketRead={asset.marketRead} />
            <div className="timeframe-row" aria-label="Chart timeframe"><span className="timeframe-button is-active">LIVE</span><span>Session data only</span></div>
            <PriceChart asset={asset} samples={session.selectedHistory} updates={relevantStoryUpdates} />
            <MovementStory asset={asset} />
            {selectedStory && <NewsStory story={selectedStory} generatedAt={session.market.generatedAt} />}
          </section>}
          {selectedTab === "company" && <CompanyProfile asset={asset} />}
          {selectedTab === "research" && <ResearchPanel asset={asset} />}
          {selectedTab === "stories" && <StoryHistory asset={asset} stories={session.market.stories} />}
        </section>

        <aside className="trade-column" aria-label={`${asset.symbol} trade and position`}>
          <TradeTicket
            key={asset.id}
            asset={asset}
            cash={session.portfolio.cash}
            ownedQuantity={position?.quantity ?? 0}
            pending={session.tradePending}
            error={session.tradeError}
            lastFill={lastFill}
            onTrade={session.trade}
          />
          {position && (
            <PositionCard
              key={`${asset.id}-${session.lastTradeId ?? "initial"}`}
              asset={asset}
              position={position}
            />
          )}
        </aside>
      </div>

    </main>
  );
}
