import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AssetSnapshot,
  MarketSnapshot,
  PortfolioPositionSnapshot,
  PortfolioSnapshot,
  ResearchProgressionSnapshot,
  TradeExecutionResponse,
  TradeFill,
  TradeSide
} from "../../../packages/shared/src/index";
import { fetchMarket, fetchPortfolio, fetchResearchProgression, openMarketUpdates, setResearchFocus, submitTrade } from "./api";
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
  research: ResearchProgressionSnapshot | null;
  researchPending: boolean;
  researchError: string | null;
  focusResearch(assetId: string): Promise<ResearchProgressionSnapshot | null>;
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
  const [tradePending, setTradePending] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [lastTrade, setLastTrade] = useState<TradeFill | null>(null);
  const [research, setResearch] = useState<ResearchProgressionSnapshot | null>(null);
  const [researchPending, setResearchPending] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);
  const researchRequestId = useRef(0);

  const applySnapshot = useCallback((snapshot: MarketSnapshot) => {
    setSnapshotState((previous) => applyMarketSnapshot(previous, snapshot));
  }, []);

  const refreshResearch = useCallback(async (): Promise<ResearchProgressionSnapshot | null> => {
    const requestId = researchRequestId.current + 1;
    researchRequestId.current = requestId;
    setResearchPending(true);
    try {
      const next = await fetchResearchProgression();
      if (researchRequestId.current === requestId) {
        setResearch(next);
        setResearchError(null);
      }
      return next;
    } catch (researchFailure) {
      if (researchRequestId.current === requestId) setResearchError(errorMessage(researchFailure));
      return null;
    } finally {
      if (researchRequestId.current === requestId) setResearchPending(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const socket = openMarketUpdates(
      (snapshot) => {
        if (cancelled) return;
        setConnectionNotice(null);
        applySnapshot(snapshot);
        void refreshResearch();
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

    void refreshResearch();

    return () => {
      cancelled = true;
      socket.close();
    };
  }, [applySnapshot, refreshResearch]);

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
      setLastTrade(result.fill);
      void refreshResearch();
      return result;
    } catch (tradeFailure) {
      setTradeError(errorMessage(tradeFailure));
      return null;
    } finally {
      setTradePending(false);
    }
  }, [refreshResearch, selectedAssetId, tradePending]);

  const focusResearch = useCallback(async (assetId: string): Promise<ResearchProgressionSnapshot | null> => {
    setResearchPending(true);
    setResearchError(null);
    try {
      const next = await setResearchFocus({ assetId });
      researchRequestId.current += 1;
      setResearch(next);
      return next;
    } catch (researchFailure) {
      setResearchError(errorMessage(researchFailure));
      return null;
    } finally {
      setResearchPending(false);
    }
  }, []);

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
    research,
    researchPending,
    researchError,
    focusResearch,
    selectAsset,
    trade,
    tradePending,
    tradeError,
    lastTrade,
    lastTradeId: lastTrade?.id ?? null
  };
}
