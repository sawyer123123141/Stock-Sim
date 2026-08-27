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
import { fetchMarket, fetchPortfolio, openMarketSocket, submitTrade } from "./api";
import { projectPortfolioToMarket } from "./portfolioProjection";

export interface PriceSample {
  atMs: number;
  price: number;
}

export type PriceHistory = Record<string, PriceSample[]>;

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
  selectAsset(assetId: string): void;
  trade(side: TradeSide, quantity: number): Promise<TradeExecutionResponse | null>;
  tradePending: boolean;
  tradeError: string | null;
  lastTrade: TradeFill | null;
  lastTradeId: string | null;
}

const MAX_HISTORY_POINTS = 120;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong while loading the market.";
}

export function useMarketSession(): MarketSession {
  const [market, setMarket] = useState<MarketSnapshot | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionNotice, setConnectionNotice] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState("nova");
  const [priceHistory, setPriceHistory] = useState<PriceHistory>({});
  const [tradePending, setTradePending] = useState(false);
  const [tradeError, setTradeError] = useState<string | null>(null);
  const [lastTrade, setLastTrade] = useState<TradeFill | null>(null);

  const applySnapshot = useCallback((snapshot: MarketSnapshot) => {
    setMarket(snapshot);
    const atMs = Date.parse(snapshot.generatedAt);
    if (!Number.isFinite(atMs)) return;

    setPriceHistory((previous) => {
      let changed = false;
      const next = { ...previous };

      for (const asset of snapshot.assets) {
        const history = previous[asset.id] ?? [];
        const last = history[history.length - 1];
        if (last?.atMs === atMs) continue;

        next[asset.id] = [...history, { atMs, price: asset.price }].slice(-MAX_HISTORY_POINTS);
        changed = true;
      }

      return changed ? next : previous;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const socket = openMarketSocket(
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
    () => portfolio && market ? projectPortfolioToMarket(portfolio, market) : portfolio,
    [portfolio, market]
  );

  const selectedAsset = useMemo(
    () => market?.assets.find((asset) => asset.id === selectedAssetId) ?? null,
    [market, selectedAssetId]
  );

  const selectedPosition = useMemo(
    () => livePortfolio?.positions.find((position) => position.assetId === selectedAssetId) ?? null,
    [livePortfolio, selectedAssetId]
  );

  const selectedHistory = priceHistory[selectedAssetId] ?? [];

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
      return result;
    } catch (tradeFailure) {
      setTradeError(errorMessage(tradeFailure));
      return null;
    } finally {
      setTradePending(false);
    }
  }, [selectedAssetId, tradePending]);

  return {
    market,
    portfolio: livePortfolio,
    loading,
    error,
    connectionNotice,
    selectedAssetId,
    selectedAsset,
    selectedPosition,
    selectedHistory,
    priceHistory,
    selectAsset,
    trade,
    tradePending,
    tradeError,
    lastTrade,
    lastTradeId: lastTrade?.id ?? null
  };
}
