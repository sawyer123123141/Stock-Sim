import type {
  AssetSnapshot,
  PortfolioSnapshot,
  TradeExecutionResponse,
  TradeIntent,
  TradingErrorCode
} from "../../../packages/shared/src/index.js";
import type { MarketRuntime } from "./marketRuntime.js";
import type { PortfolioState, PortfolioStore } from "./portfolioStore.js";

export class TradingError extends Error {
  constructor(public readonly code: TradingErrorCode, message: string) {
    super(message);
    this.name = "TradingError";
  }
}

export interface TradingService {
  getPortfolio(playerId: string): Promise<PortfolioSnapshot>;
  executeTrade(playerId: string, intent: TradeIntent): Promise<TradeExecutionResponse>;
}

export interface TradingServiceOptions {
  runtime: MarketRuntime;
  store: PortfolioStore;
  now?: () => number;
}

interface ExecutedTradeState {
  asset: AssetSnapshot;
  unitPriceCents: number;
  totalCents: number;
  executedAt: string;
  portfolio: PortfolioState;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function invalid(message: string): never {
  throw new TradingError("INVALID_TRADE", message);
}

function validateIntent(intent: TradeIntent): void {
  if (!intent || typeof intent !== "object") invalid("Trade request must be an object.");
  if (typeof intent.assetId !== "string" || intent.assetId.length === 0) {
    invalid("Asset ID is required.");
  }
  if (intent.side !== "buy" && intent.side !== "sell") {
    invalid("Trade side must be buy or sell.");
  }
  if (!Number.isSafeInteger(intent.quantity) || intent.quantity <= 0) {
    invalid("Quantity must be a positive whole number.");
  }
}

function findAsset(runtime: MarketRuntime, assetId: string): AssetSnapshot {
  const asset = runtime.snapshot().assets.find((candidate) => candidate.id === assetId);
  if (!asset) throw new TradingError("ASSET_NOT_FOUND", "Asset not found.");
  return asset;
}

function clonePortfolio(portfolio: PortfolioState): PortfolioState {
  return {
    playerId: portfolio.playerId,
    cashCents: portfolio.cashCents,
    positions: Object.fromEntries(
      Object.entries(portfolio.positions).map(([assetId, position]) => [
        assetId,
        { quantity: position.quantity, costBasisCents: position.costBasisCents }
      ])
    )
  };
}

function derivePortfolio(portfolio: PortfolioState, runtime: MarketRuntime): PortfolioSnapshot {
  const market = runtime.snapshot();
  const positions = market.assets.flatMap((asset) => {
    const stored = portfolio.positions[asset.id];
    if (!stored || stored.quantity <= 0) return [];

    const marketValue = roundMoney(asset.price * stored.quantity);
    const averageCost = roundMoney(stored.costBasisCents / stored.quantity / 100);
    const unrealizedPnL = roundMoney(marketValue - stored.costBasisCents / 100);

    return [{
      assetId: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      kind: asset.kind,
      quantity: stored.quantity,
      averageCost,
      currentPrice: asset.price,
      marketValue,
      unrealizedPnL
    }];
  });

  const cash = portfolio.cashCents / 100;
  const marketValue = roundMoney(positions.reduce((sum, position) => sum + position.marketValue, 0));
  return {
    cash,
    marketValue,
    totalValue: roundMoney(cash + marketValue),
    positions
  };
}

export function createTradingService(options: TradingServiceOptions): TradingService {
  const now = options.now ?? (() => Date.now());
  let nextTradeId = 1;

  async function getPortfolio(playerId: string): Promise<PortfolioSnapshot> {
    const portfolio = await options.store.read(playerId);
    return derivePortfolio(portfolio, options.runtime);
  }

  async function executeTrade(
    playerId: string,
    intent: TradeIntent
  ): Promise<TradeExecutionResponse> {
    validateIntent(intent);

    // Capture price and execution time only after this player's transaction reaches
    // the front of the queue. A waiting trade must not fill using a stale snapshot.
    const executed = await options.store.transact<ExecutedTradeState>(playerId, (portfolio) => {
      const asset = findAsset(options.runtime, intent.assetId);
      const unitPriceCents = Math.round(asset.price * 100);
      const totalCents = unitPriceCents * intent.quantity;

      if (
        !Number.isSafeInteger(unitPriceCents)
        || unitPriceCents <= 0
        || !Number.isSafeInteger(totalCents)
      ) {
        invalid("Trade value is outside the supported range.");
      }

      // Validate and format everything that can fail before mutating the working copy.
      const executedAtMs = now();
      const executedAtDate = new Date(executedAtMs);
      if (!Number.isFinite(executedAtMs) || Number.isNaN(executedAtDate.getTime())) {
        invalid("Execution time is invalid.");
      }
      const executedAt = executedAtDate.toISOString();
      const existing = portfolio.positions[asset.id];

      if (intent.side === "buy") {
        if (portfolio.cashCents < totalCents) {
          throw new TradingError("INSUFFICIENT_CASH", "Not enough cash for this trade.");
        }

        portfolio.cashCents -= totalCents;
        const position = existing ?? { quantity: 0, costBasisCents: 0 };
        position.quantity += intent.quantity;
        position.costBasisCents += totalCents;
        portfolio.positions[asset.id] = position;
      } else {
        if (!existing || existing.quantity < intent.quantity) {
          throw new TradingError("INSUFFICIENT_HOLDINGS", "Not enough units to sell.");
        }

        portfolio.cashCents += totalCents;
        if (existing.quantity === intent.quantity) {
          delete portfolio.positions[asset.id];
        } else {
          const soldBasisCents = Math.round(
            existing.costBasisCents * (intent.quantity / existing.quantity)
          );
          existing.quantity -= intent.quantity;
          existing.costBasisCents -= soldBasisCents;
        }
      }

      return {
        asset,
        unitPriceCents,
        totalCents,
        executedAt,
        portfolio: clonePortfolio(portfolio)
      };
    });

    const fill = {
      id: `trade-${nextTradeId++}`,
      assetId: executed.asset.id,
      symbol: executed.asset.symbol,
      side: intent.side,
      quantity: intent.quantity,
      unitPrice: executed.unitPriceCents / 100,
      total: executed.totalCents / 100,
      executedAt: executed.executedAt
    };

    return {
      fill,
      portfolio: derivePortfolio(executed.portfolio, options.runtime)
    };
  }

  return { getPortfolio, executeTrade };
}
