import type { MarketSnapshot, PortfolioSnapshot } from "../../../packages/shared/src/index.js";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function projectPortfolioToMarket(
  portfolio: PortfolioSnapshot,
  market: MarketSnapshot
): PortfolioSnapshot {
  const prices = new Map(market.assets.map((asset) => [asset.id, asset.price]));
  let changed = false;

  const positions = portfolio.positions.map((position) => {
    const currentPrice = prices.get(position.assetId);
    if (currentPrice === undefined) return position;

    const marketValue = roundMoney(currentPrice * position.quantity);
    const costBasis = roundMoney(position.marketValue - position.unrealizedPnL);
    const unrealizedPnL = roundMoney(marketValue - costBasis);

    if (
      currentPrice === position.currentPrice
      && marketValue === position.marketValue
      && unrealizedPnL === position.unrealizedPnL
    ) {
      return position;
    }

    changed = true;
    return {
      ...position,
      currentPrice,
      marketValue,
      unrealizedPnL
    };
  });

  if (!changed) return portfolio;

  const marketValue = roundMoney(
    positions.reduce((sum, position) => sum + position.marketValue, 0)
  );

  return {
    cash: portfolio.cash,
    marketValue,
    totalValue: roundMoney(portfolio.cash + marketValue),
    positions
  };
}
