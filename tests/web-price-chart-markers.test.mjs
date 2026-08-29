import test from "node:test";
import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const markersModule = new URL("../apps/web/src/priceChartMarkers.ts", import.meta.url);

async function markers(samples, updates) {
  const { stdout } = await execFile(process.execPath, [
    "--no-warnings",
    "--experimental-strip-types",
    "--input-type=module",
    "--eval",
    `import { selectChartStoryMarkers } from ${JSON.stringify(markersModule.href)}; console.log(JSON.stringify(selectChartStoryMarkers(${JSON.stringify(samples)}, ${JSON.stringify(updates)})));`
  ]);
  return JSON.parse(stdout);
}

test("chart markers include only public updates in the visible timestamp range", async () => {
  const selected = await markers(
    [
      { atMs: 1_000, price: 40 },
      { atMs: 3_000, price: 41 },
      { atMs: 5_000, price: 42 }
    ],
    [
      { id: "past", title: "Past", summary: "", publishedAt: "1970-01-01T00:00:00.000Z" },
      { id: "start", title: "Start", summary: "", publishedAt: "1970-01-01T00:00:01.000Z" },
      { id: "middle", title: "Middle", summary: "", publishedAt: "1970-01-01T00:00:03.000Z" },
      { id: "end", title: "End", summary: "", publishedAt: "1970-01-01T00:00:05.000Z" },
      { id: "future", title: "Future", summary: "", publishedAt: "1970-01-01T00:00:06.000Z" }
    ]
  );

  assert.deepEqual(selected.map((marker) => [marker.update.id, marker.x]), [
    ["start", 0],
    ["middle", 0.5],
    ["end", 1]
  ]);
});

test("the price chart renders neutral accessible public-information markers", async () => {
  const root = new URL("../", import.meta.url);
  const [chart, app] = await Promise.all([
    readFile(new URL("apps/web/src/components/PriceChart.tsx", root), "utf8"),
    readFile(new URL("apps/web/src/App.tsx", root), "utf8")
  ]);

  assert.match(chart, /selectChartStoryMarkers/);
  assert.match(chart, /chart-story-marker/);
  assert.match(chart, /role="button"/);
  assert.match(chart, /aria-label/);
  assert.match(app, /selectRelevantMarketStories/);
});
