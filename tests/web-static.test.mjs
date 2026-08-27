import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

async function text(path) {
  return readFile(new URL(path, root), "utf8");
}

async function json(path) {
  return JSON.parse(await text(path));
}

test("stage 1 web client has a Vite mount boundary and root scripts", async () => {
  const [pkg, html, main, app] = await Promise.all([
    json("package.json"),
    text("apps/web/index.html"),
    text("apps/web/src/main.tsx"),
    text("apps/web/src/App.tsx")
  ]);

  assert.equal(pkg.scripts["dev:web"], "vite --config apps/web/vite.config.ts");
  assert.equal(pkg.scripts["build:web"], "vite build --config apps/web/vite.config.ts");
  assert.match(pkg.scripts.test, /npm run build:web/, "npm test must compile the browser client in CI");
  assert.match(pkg.scripts.typecheck, /apps\/web\/tsconfig\.json/, "root typecheck must include the browser client");
  assert.match(html, /id=["']root["']/);
  assert.match(main, /createRoot/);
  assert.match(main, /<App\s*\/?>/);
  assert.match(app, /export\s+function\s+App/);
});

test("browser transport sends intent only and session state follows authoritative snapshots", async () => {
  const [api, session] = await Promise.all([
    text("apps/web/src/api.ts"),
    text("apps/web/src/useMarketSession.ts")
  ]);

  assert.match(api, /fetchMarket/);
  assert.match(api, /fetchPortfolio/);
  assert.match(api, /submitTrade/);
  assert.match(api, /openMarketSocket/);
  assert.match(api, /assetId/);
  assert.match(api, /side/);
  assert.match(api, /quantity/);
  assert.doesNotMatch(api, /unitPrice\s*:/, "client must not submit an execution price");
  assert.doesNotMatch(api, /playerId\s*:/, "client must not choose canonical player identity");
  assert.doesNotMatch(api, /cash\s*:/, "client must not submit canonical cash");

  assert.match(session, /selectedAssetId/);
  assert.match(session, /priceHistory/);
  assert.match(session, /tradePending/);
  assert.match(session, /tradeError/);
  assert.match(session, /120/);
  assert.match(session, /generatedAt/);
  assert.match(session, /nova/);
});

test("stage 1 market surface stays focused on assets and a credible chart", async () => {
  const [app, chart, rail, header] = await Promise.all([
    text("apps/web/src/App.tsx"),
    text("apps/web/src/components/PriceChart.tsx"),
    text("apps/web/src/components/AssetRail.tsx"),
    text("apps/web/src/components/MarketHeader.tsx")
  ]);
  const combined = `${app}\n${chart}\n${rail}\n${header}`;

  assert.match(app, /<MarketHeader/);
  assert.match(app, /<AssetRail/);
  assert.match(app, /<PriceChart/);
  assert.match(chart, /role=["']img["']/);
  assert.match(rail, /slice\(0,\s*5\)/);
  assert.match(rail, /aria-pressed/);
  assert.match(header, /MARKET ERA/);
  assert.match(header, /Market Live/);
  assert.doesNotMatch(combined, /Shop|Gems|Energy|Limit Order|Margin|Top Movers/);
});

test("stage 1 trade flow is one whole-unit Buy Sell path without advanced orders", async () => {
  const [app, ticket, position] = await Promise.all([
    text("apps/web/src/App.tsx"),
    text("apps/web/src/components/TradeTicket.tsx"),
    text("apps/web/src/components/PositionCard.tsx")
  ]);
  const combined = `${app}\n${ticket}\n${position}`;

  assert.match(app, /<TradeTicket/);
  assert.match(app, /<PositionCard/);
  assert.match(ticket, />Buy</);
  assert.match(ticket, />Sell</);
  assert.match(ticket, /role=["']group["']/);
  assert.match(ticket, /type=["']number["']/);
  assert.match(ticket, /min=["']1["']/);
  assert.match(ticket, /step=["']1["']/);
  assert.match(ticket, /Estimated total/);
  assert.match(ticket, /Confirm \{side === "buy" \? "Buy" : "Sell"\}/);
  assert.match(ticket, /Cash available/);
  assert.match(ticket, /Owned/);
  assert.match(position, /Average cost/);
  assert.match(position, /Market value/);
  assert.match(position, /Unrealized/);
  assert.doesNotMatch(combined, /Limit Order|Stop Loss|Take Profit|Margin|Leverage/);
});

test("stage 1 ends with one movement story, one objective, and responsive accessible polish", async () => {
  const [app, story, objective, styles, tradeStyles, insightStyles, readme] = await Promise.all([
    text("apps/web/src/App.tsx"),
    text("apps/web/src/components/MovementStory.tsx"),
    text("apps/web/src/components/NextObjective.tsx"),
    text("apps/web/src/styles.css"),
    text("apps/web/src/trade.css"),
    text("apps/web/src/insights.css"),
    text("README.md")
  ]);

  assert.equal((app.match(/<MovementStory/g) ?? []).length, 1);
  assert.equal((app.match(/<NextObjective/g) ?? []).length, 1);
  assert.match(story, /reasons\[0\]/);
  assert.match(story, /strongestReason\?\.direction/);
  assert.match(story, /No major driver is dominating this move right now\./);
  assert.match(objective, /Make your first investment/);
  assert.match(objective, /Own 2 different assets/);
  assert.match(`${styles}\n${tradeStyles}\n${insightStyles}`, /@media\s*\(max-width:/);
  assert.match(`${styles}\n${tradeStyles}\n${insightStyles}`, /prefers-reduced-motion/);
  assert.match(readme, /npm run start:server/);
  assert.match(readme, /npm run dev:web/);
  assert.match(readme, /npm run build:web/);
});

test("stage 1.1 keeps the first minutes focused and makes feedback feel consequential", async () => {
  const [app, session, ticket, objective, chart, styles, tradeStyles] = await Promise.all([
    text("apps/web/src/App.tsx"),
    text("apps/web/src/useMarketSession.ts"),
    text("apps/web/src/components/TradeTicket.tsx"),
    text("apps/web/src/components/NextObjective.tsx"),
    text("apps/web/src/components/PriceChart.tsx"),
    text("apps/web/src/styles.css"),
    text("apps/web/src/trade.css")
  ]);

  assert.match(app, /position\s*&&\s*\(/, "empty accounts should not spend space on a blank position card");
  assert.match(app, /quote-tick/, "the current quote should have restrained live-tick feedback");

  assert.match(session, /lastTrade/);
  assert.match(ticket, /lastFill/);
  assert.match(ticket, /role=["']status["']/);
  assert.match(ticket, /Bought|Sold/);
  assert.match(tradeStyles, /trade-success/);

  assert.match(objective, /First steps complete/);
  assert.match(objective, /ownedAssets\s*>=\s*2/);

  assert.doesNotMatch(chart, /atMs:\s*samples\[0\]\.atMs\s*\+\s*1/, "the chart must not fabricate a second history point");
  assert.match(chart, /Waiting for the next live update/);
  assert.match(styles, /quote-tick/);
});
