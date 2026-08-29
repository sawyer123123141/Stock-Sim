import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const text = (path) => readFile(new URL(path, root), "utf8");

test("Developing Stories renders a compact public timeline without directional advice", async () => {
  const [story, app, styles] = await Promise.all([
    text("apps/web/src/components/NewsStory.tsx"),
    text("apps/web/src/App.tsx"),
    text("apps/web/src/insights.css")
  ]);

  assert.match(story, /MarketStorySnapshot/);
  assert.match(story, /DEVELOPING STORY/);
  assert.match(story, /RECENT STORY/);
  assert.match(story, /story\.updates\.map/);
  assert.match(story, /story\.status/);
  assert.match(app, /selectRelevantMarketStory/);
  assert.match(styles, /developing-story/);
  assert.match(styles, /\.insight-strip\.has-news\s*\{\s*grid-template-columns:\s*1fr;/);
  assert.doesNotMatch(`${story}\n${app}`, /GOOD|BAD|BULLISH|BEARISH|BUY NOW|SELL NOW/);
});
