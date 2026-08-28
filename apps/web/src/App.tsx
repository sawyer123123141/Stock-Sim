import { AssetRail } from "./components/AssetRail";
import { MarketHeader } from "./components/MarketHeader";
import { MovementStory } from "./components/MovementStory";
import { NewsStory } from "./components/NewsStory";
import { NextObjective } from "./components/NextObjective";
import { PositionCard } from "./components/PositionCard";
import { PriceChart } from "./components/PriceChart";
import { TradeTicket } from "./components/TradeTicket";
import {
  describeMarketChange,
  formatMoney,
  formatSignedPercent,
  marketChangeTone
} from "./format";
import { useMarketSession } from "./useMarketSession";
import { selectRelevantMarketEvent } from "./marketEventSelection";

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
  const position = session.selectedPosition;
  const marketTone = marketChangeTone(asset.lastTickChangePct);
  const marketChange = describeMarketChange(asset.lastTickChangePct);
  const lastFill = session.lastTrade?.assetId === asset.id ? session.lastTrade : null;
  const selectedEvent = selectRelevantMarketEvent(asset, session.market.events);

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

          <div className="timeframe-row" aria-label="Chart timeframe">
            <span className="timeframe-button is-active">LIVE</span>
            <span>Session data only</span>
          </div>

          <PriceChart asset={asset} samples={session.selectedHistory} />
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

      <section className={`insight-strip${selectedEvent ? " has-news" : ""}`} aria-label="Market guidance">
        {selectedEvent && (
          <NewsStory event={selectedEvent} generatedAt={session.market.generatedAt} />
        )}
        <MovementStory asset={asset} />
        <NextObjective ownedAssetCount={session.firstSessionOwnedAssetCount} />
      </section>
    </main>
  );
}
