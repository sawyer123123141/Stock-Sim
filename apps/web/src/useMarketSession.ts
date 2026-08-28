import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AssetSnapshot,
  MarketSnapshot,
  PortfolioPositionSnapshot,
  PortfolioSnapshot,
  TradeExecutionResponse,
  TradeFill,
  TradeSide
} from "../../../packages/shared/src/index";
import { fetchMarket, fetchPortfolio, openMarketUpdates, submitTrade } from "./api";
import { rememberOwnedAssetIds } from "./firstSessionProgress";
import {
  applyMarketSnapshot,
  type MarketSnapshotState,
  type PriceHistory,
  type PriceSample
} from "./marketSnapshotState";
import { projectPortfolioToMarket } from "./portfolioProjection";

export type { PriceHistory, PriceSample } from "./marketSnapshotState";

export interface MarketSession {
  market: MarketSnapshot | null;
  portfolio: PortfolioSnapshot | null;
  loading: boolean;
  error: string | null;
  connectionNotice: string | null;
  selectedAssetId: string;
  selectedAsset: AssetSnapshot | null;
  selectedPosition: PortfolioPositionSnapshot | null;
  selectedHistory: PriceSample[];
  priceHistory: PriceHistory;
  firstSessionOwnedAssetCount: number;
  selectAsset(assetId: string): void;
  trade(side: TradeSide, quantity: number): Promise<TradeExecutionResponse | null>;
  tradePending: boolean;
  tradeError: string | null;
  lastTrade: TradeFill | null;
  lastTradeId: string | null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong while loading the market.";
}

export function useMarketSession(): MarketSession {
  const [snapshotState, setSnapshotState] = useState<MarketSnapshotState>({
    market: null,
    priceHistory: {}
  });
  const [portfolio, setPortfolio] = useState<PortfolioSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionNotice, setConnectionNotice] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState("nova");
  const [firstSessionAssetIds, setFirstSessionAssetIds] = useState<string[]>([]);
  const [tradePending, setTradePending] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [lastTrade, setLastTrade] = useState<TradeFill | null>(null);

  const applySnapshot = useCallback((snapshot: MarketSnapshot) => {
    setSnapshotState((previous) => applyMarketSnapshot(previous, snapshot));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const socket = openMarketUpdates(
      (snapshot) => {
        if (cancelled) return;
        setConnectionNotice(null);
        applySnapshot(snapshot);
      },
      (message) => {
        if (!cancelled) setConnectionNotice(message);
      }
    );

    void Promise.all([fetchMarket(), fetchPortfolio()])
      .then(([initialMarket, initialPortfolio]) => {
        if (cancelled) return;
        applySnapshot(initialMarket);
        setPortfolio(initialPortfolio);
        setFirstSessionAssetIds((previous) => rememberOwnedAssetIds(previous, initialPortfolio.positions));
        const preferred = initialMarket.assets.find((asset) => asset.id === "nova")
          ?? initialMarket.assets[0];
        if (preferred) setSelectedAssetId(preferred.id);
        setError(null);
      })
      .catch((loadError) => {
        if (!cancelled) setError(errorMessage(loadError));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      socket.close();
    };
  }, [applySnapshot]);

  const selectAsset = useCallback((assetId: string) => {
    setSelectedAssetId(assetId);
    setTradeError(null);
    setLastTrade(null);
  }, []);

  const livePortfolio = useMemo(
    () => portfolio && snapshotState.market
      ? projectPortfolioToMarket(portfolio, snapshotState.market)
      : portfolio,
    [portfolio, snapshotState.market]
  );

  const selectedAsset = useMemo(
    () => snapshotState.market?.assets.find((asset) => asset.id === selectedAssetId) ?? null,
    [snapshotState.market, selectedAssetId]
  );

  const selectedPosition = useMemo(
    () => livePortfolio?.positions.find((position) => position.assetId === selectedAssetId) ?? null,
    [livePortfolio, selectedAssetId]
  );

  const selectedHistory = snapshotState.priceHistory[selectedAssetId] ?? [];

  const trade = useCallback(async (
    side: TradeSide,
    quantity: number
  ): Promise<TradeExecutionResponse | null> => {
    if (!selectedAssetId || tradePending) return null;

    setTradePending(true);
    setTradeError(null);
    setLastTrade(null);
    try {
      const result = await submitTrade({ assetId: selectedAssetId, side, quantity });
      setPortfolio(result.portfolio);
      setFirstSessionAssetIds((previous) => rememberOwnedAssetIds(previous, result.portfolio.positions));
      setLastTrade(result.fill);
      return result;
    } catch (tradeFailure) {
      setTradeError(errorMessage(tradeFailure));
      return null;
    } finally {
      setTradePending(false);
    }
  }, [selectedAssetId, tradePending]);

  return {
    market: snapshotState.market,
    portfolio: livePortfolio,
    loading,
    error,
    connectionNotice,
    selectedAssetId,
    selectedAsset,
    selectedPosition,
    selectedHistory,
    priceHistory: snapshotState.priceHistory,
    firstSessionOwnedAssetCount: firstSessionAssetIds.length,
    selectAsset,
    trade,
    tradePending,
    tradeError,
    lastTrade,
    lastTradeId: lastTrade?.id ?? null
  };
}
