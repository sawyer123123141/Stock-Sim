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
