import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const text = (path) => readFile(new URL(path, root), "utf8");

test("Market Experience V1 exposes local asset tabs and keeps crypto company research absent", async () => {
  const [app, tabs, company, research, styles] = await Promise.all([
    text("apps/web/src/App.tsx"),
    text("apps/web/src/components/AssetTabs.tsx"),
    text("apps/web/src/components/CompanyProfile.tsx"),
    text("apps/web/src/components/ResearchPanel.tsx"),
    text("apps/web/src/styles.css")
  ]);

  assert.match(app, /useState<AssetTab>/);
  assert.match(app, /setSelectedTab\("overview"\)/);
  assert.match(tabs, /role="tablist"/);
  assert.match(tabs, /Overview/);
  assert.match(tabs, /Company/);
  assert.match(tabs, /Research/);
  assert.match(tabs, /Stories/);
  assert.match(tabs, /asset\.kind === "stock"/);
  assert.match(company, /Nova Motors/);
  assert.match(research, /Company outlook/);
  assert.match(research, /Market expectations/);
  assert.match(styles, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /grid-column: 1 \/ -1/);
});

test("Market Read and Why the Move use concise qualitative disclosure", async () => {
  const [marketRead, movement, header] = await Promise.all([
    text("apps/web/src/components/MarketRead.tsx"),
    text("apps/web/src/components/MovementStory.tsx"),
    text("apps/web/src/components/MarketHeader.tsx")
  ]);

  assert.match(marketRead, /MARKET READ/);
  assert.match(marketRead, /Buyers have a slight edge/);
  assert.match(marketRead, /Price movement is fairly calm/);
  assert.doesNotMatch(marketRead, /likely to rise|buy now|sell now/i);
  assert.match(movement, /aria-expanded/);
  assert.match(movement, /asset\.reasons\.slice\(0, 3\)/);
  assert.match(movement, /No major driver is dominating/);
  assert.match(header, /NEXT OBJECTIVE/);
});

test("overview keeps qualitative market context compact, expandable, and separate from public stories", async () => {
  const [app, marketRead, movement, header] = await Promise.all([
    text("apps/web/src/App.tsx"),
    text("apps/web/src/components/MarketRead.tsx"),
    text("apps/web/src/components/MovementStory.tsx"),
    text("apps/web/src/components/MarketHeader.tsx")
  ]);

  assert.match(marketRead, /MARKET READ/);
  assert.doesNotMatch(marketRead, /pressure:\s*\{|pricedExpectations|fundamentals|reactionEffect|RNG/i);
  assert.match(movement, /More context/);
  assert.match(movement, /aria-expanded/);
  assert.match(movement, /asset\.reasons\.slice\(0, 3\)/);
  assert.match(movement, /reason\.summary/);
  assert.ok(app.indexOf("<MovementStory") < app.indexOf("<NewsStory"), "current movement context and public story history remain separate overview surfaces");
  assert.match(header, /objective-chip/);
  assert.equal((app.match(/<NextObjective/g) ?? []).length, 0);
});

test("Stories history uses existing relevance helpers and keeps the full timeline public-only", async () => {
  const [history, selection] = await Promise.all([
    text("apps/web/src/components/StoryHistory.tsx"),
    text("apps/web/src/marketEventSelection.ts")
  ]);

  assert.match(history, /selectStoryHistory/);
  assert.match(history, /story\.updates\.map/);
  assert.match(selection, /selectStoryHistory/);
  assert.match(selection, /status === "developing"/);
});
