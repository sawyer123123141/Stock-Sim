import test from "node:test";
import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const selectorModule = new URL("../apps/web/src/marketEventSelection.ts", import.meta.url);

async function selectStory(asset, stories) {
  const { stdout } = await execFile(process.execPath, [
    "--no-warnings",
    "--experimental-strip-types",
    "--input-type=module",
    "--eval",
    `import { selectRelevantMarketStory } from ${JSON.stringify(selectorModule.href)}; console.log(JSON.stringify(selectRelevantMarketStory(${JSON.stringify(asset)}, ${JSON.stringify(stories)})));`
  ]);
  return JSON.parse(stdout);
}

async function selectStories(asset, stories) {
  const { stdout } = await execFile(process.execPath, [
    "--no-warnings",
    "--experimental-strip-types",
    "--input-type=module",
    "--eval",
    `import { selectRelevantMarketStories } from ${JSON.stringify(selectorModule.href)}; console.log(JSON.stringify(selectRelevantMarketStories(${JSON.stringify(asset)}, ${JSON.stringify(stories)})));`
  ]);
  return JSON.parse(stdout);
}

async function selectStoryHistory(asset, stories) {
  const { stdout } = await execFile(process.execPath, [
    "--no-warnings",
    "--experimental-strip-types",
    "--input-type=module",
    "--eval",
    `import { selectStoryHistory } from ${JSON.stringify(selectorModule.href)}; console.log(JSON.stringify(selectStoryHistory(${JSON.stringify(asset)}, ${JSON.stringify(stories)})));`
  ]);
  return JSON.parse(stdout);
}

test("a relevant developing sector story beats an older resolved asset story", async () => {
  const selected = await selectStory(
    { id: "nova", sector: "Mobility" },
    [
      { id: "resolved-asset", title: "Resolved asset", target: { kind: "asset", value: "nova" }, status: "resolved", updates: [{ id: "asset", title: "Old", summary: "", publishedAt: "2026-01-01T00:01:00.000Z" }] },
      { id: "developing-sector", title: "Developing sector", target: { kind: "sector", value: "Mobility" }, status: "developing", updates: [{ id: "sector", title: "Current", summary: "", publishedAt: "2026-01-01T00:02:00.000Z" }] }
    ]
  );

  assert.equal(selected.id, "developing-sector");
});

test("a lone relevant developing global story beats an older resolved asset story", async () => {
  const selected = await selectStory(
    { id: "nova", sector: "Mobility" },
    [
      { id: "resolved-asset", title: "Resolved asset", target: { kind: "asset", value: "nova" }, status: "resolved", updates: [{ id: "asset", title: "Old", summary: "", publishedAt: "2026-01-01T00:01:00.000Z" }] },
      { id: "developing-global", title: "Developing global", target: { kind: "global" }, status: "developing", updates: [{ id: "global", title: "Current", summary: "", publishedAt: "2026-01-01T00:02:00.000Z" }] }
    ]
  );

  assert.equal(selected.id, "developing-global");
});

test("an asset-specific developing story beats a sector-specific developing story", async () => {
  const selected = await selectStory(
    { id: "nova", sector: "Mobility" },
    [
      { id: "developing-sector", title: "Developing sector", target: { kind: "sector", value: "Mobility" }, status: "developing", updates: [{ id: "sector", title: "Newer", summary: "", publishedAt: "2026-01-01T00:03:00.000Z" }] },
      { id: "developing-asset", title: "Developing asset", target: { kind: "asset", value: "nova" }, status: "developing", updates: [{ id: "asset", title: "Older", summary: "", publishedAt: "2026-01-01T00:01:00.000Z" }] }
    ]
  );

  assert.equal(selected.id, "developing-asset");
});

test("resolved stories retain relevance first and recency as their tie breaker", async () => {
  const selected = await selectStory(
    { id: "nova", sector: "Mobility" },
    [
      { id: "global", title: "Global", target: { kind: "global" }, status: "resolved", updates: [{ id: "global", title: "Newest", summary: "", publishedAt: "2026-01-01T00:04:00.000Z" }] },
      { id: "old-asset", title: "Old asset", target: { kind: "asset", value: "nova" }, status: "resolved", updates: [{ id: "asset-old", title: "Old", summary: "", publishedAt: "2026-01-01T00:01:00.000Z" }] },
      { id: "new-asset", title: "New asset", target: { kind: "asset", value: "nova" }, status: "resolved", updates: [{ id: "asset-new", title: "New", summary: "", publishedAt: "2026-01-01T00:03:00.000Z" }] }
    ]
  );

  assert.equal(selected.id, "new-asset");
});

test("chart selection keeps every public story relevant to the selected asset", async () => {
  const stories = [
    { id: "global", title: "Global", target: { kind: "global" }, status: "resolved", updates: [{ id: "g", title: "Global update", summary: "", publishedAt: "2026-01-01T00:01:00.000Z" }] },
    { id: "asset", title: "Asset", target: { kind: "asset", value: "nova" }, status: "developing", updates: [{ id: "a", title: "Asset update", summary: "", publishedAt: "2026-01-01T00:02:00.000Z" }] },
    { id: "other", title: "Other", target: { kind: "asset", value: "luma" }, status: "developing", updates: [{ id: "o", title: "Other update", summary: "", publishedAt: "2026-01-01T00:03:00.000Z" }] }
  ];

  const selected = await selectStories({ id: "nova", sector: "Mobility" }, stories);
  assert.deepEqual(selected.map((story) => story.id), ["asset", "global"]);
});

test("Stories history keeps relevant public stories, with developing stories before resolved history", async () => {
  const selected = await selectStoryHistory(
    { id: "nova", sector: "Mobility" },
    [
      { id: "resolved-asset", title: "Resolved asset", target: { kind: "asset", value: "nova" }, status: "resolved", updates: [{ id: "ra", title: "Old asset update", summary: "", publishedAt: "2026-01-01T00:01:00.000Z" }] },
      { id: "resolved-global", title: "Resolved global", target: { kind: "global" }, status: "resolved", updates: [{ id: "rg", title: "New global update", summary: "", publishedAt: "2026-01-01T00:04:00.000Z" }] },
      { id: "developing-sector", title: "Developing sector", target: { kind: "sector", value: "Mobility" }, status: "developing", updates: [{ id: "ds", title: "Sector update", summary: "", publishedAt: "2026-01-01T00:03:00.000Z" }] },
      { id: "other-asset", title: "Other asset", target: { kind: "asset", value: "luma" }, status: "developing", updates: [{ id: "other", title: "Hidden", summary: "", publishedAt: "2026-01-01T00:05:00.000Z" }] }
    ]
  );

  assert.deepEqual(selected.map((story) => story.id), ["developing-sector", "resolved-asset", "resolved-global"]);
  assert.ok(selected.every((story) => story.updates.every((update) => update.publishedAt)));
});
