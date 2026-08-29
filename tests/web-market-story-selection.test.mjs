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

test("the client selects the most relevant recent public story for the selected asset", async () => {
  const selected = await selectStory(
    { id: "nova", sector: "Mobility" },
    [
      { id: "global", title: "Global", target: { kind: "global" }, status: "resolved", updates: [{ id: "g", title: "Older", summary: "", publishedAt: "2026-01-01T00:02:00.000Z" }] },
      { id: "sector", title: "Sector", target: { kind: "sector", value: "Mobility" }, status: "resolved", updates: [{ id: "s", title: "Newer", summary: "", publishedAt: "2026-01-01T00:03:00.000Z" }] },
      { id: "asset", title: "Asset", target: { kind: "asset", value: "nova" }, status: "developing", updates: [{ id: "a", title: "Latest", summary: "", publishedAt: "2026-01-01T00:01:00.000Z" }] },
      { id: "other", title: "Other", target: { kind: "asset", value: "luma" }, status: "developing", updates: [{ id: "o", title: "Ignore", summary: "", publishedAt: "2026-01-01T00:04:00.000Z" }] }
    ]
  );

  assert.equal(selected.id, "asset");
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
