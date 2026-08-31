import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const text = (path) => readFile(new URL(path, root), "utf8");

test("Research UI renders locked, unfocused, and focused states from player research instead of AssetSnapshot", async () => {
  const [session, panel, header, api, app, tabs, styles] = await Promise.all([
    text("apps/web/src/useMarketSession.ts"),
    text("apps/web/src/components/ResearchPanel.tsx"),
    text("apps/web/src/components/MarketHeader.tsx"),
    text("apps/web/src/api.ts"),
    text("apps/web/src/App.tsx"),
    text("apps/web/src/components/AssetTabs.tsx"),
    text("apps/web/src/styles.css")
  ]);

  assert.match(api, /fetchResearchProgression/);
  assert.match(api, /setResearchFocus/);
  assert.match(session, /researchPending/);
  assert.match(session, /focusResearch/);
  assert.doesNotMatch(session, /firstSessionOwnedAssetCount|rememberOwnedAssetIds/);
  assert.match(panel, /first stock investment/i);
  assert.match(panel, /Research this company/);
  assert.match(panel, /Move research focus/);
  assert.match(panel, /Good results can still feel ordinary when expectations are high/);
  assert.match(panel, /constructive: "Investors expect healthy demand"/);
  assert.match(panel, /high: "Investors expect strong demand"/);
  assert.doesNotMatch(panel, /asset\.research/);
  assert.match(header, /make-first-stock-investment/);
  assert.match(header, /build-small-stock-portfolio/);
  assert.match(header, /INVESTOR STAGE/);
  assert.match(header, /Independent Investor/);
  assert.doesNotMatch(header, /\bXP\b|Investor Level|Progress Bar|Achievement/i);
  assert.match(app, /focusResearch/);
  assert.match(tabs, /asset\.kind === "stock"/);
  assert.match(styles, /@media \(max-width: 560px\)/);
  assert.match(styles, /\.research-row/);
  assert.match(styles, /objective-chip-stage/);
});

test("successful trade completion does not await the secondary Research refresh", async () => {
  const session = await text("apps/web/src/useMarketSession.ts");

  assert.doesNotMatch(session, /await refreshResearch\(\)/);
  assert.match(session, /void refreshResearch\(\)/);
});
