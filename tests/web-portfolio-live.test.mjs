import test from "node:test";
import assert from "node:assert/strict";

const projectionModule = new URL("../dist/apps/web/src/portfolioProjection.js", import.meta.url);

test("browser portfolio projection follows the latest authoritative market prices", async () => {
  const { projectPortfolioToMarket } = await import(projectionModule.href);

  const portfolio = {
    cash: 5000,
    marketValue: 4000,
    totalValue: 9000,
    positions: [
      {
        assetId: "nova",
        symbol: "NOVA",
        name: "Nova Motors",
        kind: "stock",
        quantity: 100,
        averageCost: 40,
        currentPrice: 40,
        marketValue: 4000,
        unrealizedPnL: 0
      }
    ]
  };

  const market = {
    sequence: 12,
    generatedAt: "2026-08-27T15:00:00.000Z",
    assets: [
      {
        id: "nova",
        symbol: "NOVA",
        name: "Nova Motors",
        kind: "stock",
        price: 42,
        lastTickChangePct: 1.2,
        reasons: []
      }
    ]
  };

  const projected = projectPortfolioToMarket(portfolio, market);

  assert.equal(projected.cash, 5000);
  assert.equal(projected.marketValue, 4200);
  assert.equal(projected.totalValue, 9200);
  assert.equal(projected.positions[0].currentPrice, 42);
  assert.equal(projected.positions[0].marketValue, 4200);
  assert.equal(projected.positions[0].unrealizedPnL, 200);
});

test("portfolio projection leaves positions unchanged when an asset is missing", async () => {
  const { projectPortfolioToMarket } = await import(projectionModule.href);

  const portfolio = {
    cash: 100,
    marketValue: 50,
    totalValue: 150,
    positions: [
      {
        assetId: "missing",
        symbol: "MISS",
        name: "Missing Asset",
        kind: "stock",
        quantity: 1,
        averageCost: 50,
        currentPrice: 50,
        marketValue: 50,
        unrealizedPnL: 0
      }
    ]
  };

  const market = {
    sequence: 1,
    generatedAt: "2026-08-27T15:00:00.000Z",
    assets: []
  };

  const projected = projectPortfolioToMarket(portfolio, market);

  assert.deepEqual(projected, portfolio);
});
