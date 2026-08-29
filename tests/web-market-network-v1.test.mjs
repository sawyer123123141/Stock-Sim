import test from "node:test";
import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const root = new URL("../", import.meta.url);
const selectorModule = new URL("../apps/web/src/marketEventSelection.ts", import.meta.url);

async function selectForNOVA(stories) {
  const { stdout } = await execFile(process.execPath, [
    "--no-warnings",
    "--experimental-strip-types",
    "--input-type=module",
    "--eval",
    `import { selectRelevantMarketStory, selectRelevantMarketStoryUpdates } from ${JSON.stringify(selectorModule.href)}; const asset = { id: "nova", sector: "Mobility" }; console.log(JSON.stringify({ story: selectRelevantMarketStory(asset, ${JSON.stringify(stories)}), updates: selectRelevantMarketStoryUpdates(asset, ${JSON.stringify(stories)}) }));`
  ]);
  return JSON.parse(stdout);
}

test("connected-company stories rank below a direct NOVA story and chart only their actual spillover update", async () => {
  const stories = [
    { id: "luma", title: "LUMA update", target: { kind: "asset", value: "luma" }, status: "developing", updates: [
      { id: "related", title: "Battery breakthrough", summary: "", publishedAt: "2026-01-01T00:01:00.000Z", relatedAssetIds: ["nova"] },
      { id: "unrelated", title: "Later LUMA detail", summary: "", publishedAt: "2026-01-01T00:02:00.000Z" }
    ] },
    { id: "nova", title: "NOVA update", target: { kind: "asset", value: "nova" }, status: "developing", updates: [{ id: "direct", title: "NOVA demand", summary: "", publishedAt: "2026-01-01T00:00:00.000Z" }] },
    { id: "sector", title: "Mobility", target: { kind: "sector", value: "Mobility" }, status: "developing", updates: [{ id: "sector", title: "Sector", summary: "", publishedAt: "2026-01-01T00:03:00.000Z" }] }
  ];

  const result = await selectForNOVA(stories);
  assert.equal(result.story.id, "nova");
  assert.deepEqual(result.updates.map((update) => update.id), ["direct", "related", "sector"]);
});

test("Market Network surfaces direction-aware company and research context without relationship internals", async () => {
  const text = (path) => readFile(new URL(path, root), "utf8");
  const [company, research, history, chart] = await Promise.all([
    text("apps/web/src/components/CompanyProfile.tsx"),
    text("apps/web/src/components/ResearchPanel.tsx"),
    text("apps/web/src/components/StoryHistory.tsx"),
    text("apps/web/src/components/PriceChart.tsx")
  ]);

  assert.match(company, /BUSINESS CONNECTIONS/);
  assert.match(company, /Battery technology supplier/);
  assert.match(research, /MARKET CONNECTIONS/);
  assert.match(research, /outside battery technology/);
  assert.match(history, /RELATED COMPANY/);
  assert.match(chart, /Related company information/);
  assert.doesNotMatch(`${company}\n${research}\n${history}\n${chart}`, /reactionEffect|expectationDeltas|luma-nova-supplier|0\.14/);
});
