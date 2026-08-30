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

async function timeline(samples) {
  const { stdout } = await execFile(process.execPath, [
    "--no-warnings",
    "--experimental-strip-types",
    "--input-type=module",
    "--eval",
    `import { selectChartSamplePositions } from ${JSON.stringify(markersModule.href)}; console.log(JSON.stringify(selectChartSamplePositions(${JSON.stringify(samples)})));`
  ]);
  return JSON.parse(stdout);
}

test("irregular price samples and story markers share one timestamp X-axis", async () => {
  const samples = [
    { atMs: 0, price: 40 },
    { atMs: 5_000, price: 41 },
    { atMs: 20_000, price: 42 }
  ];
  const [positions, storyMarkers] = await Promise.all([
    timeline(samples),
    markers(samples, [{ id: "five-seconds", title: "Update", summary: "", publishedAt: "1970-01-01T00:00:05.000Z" }])
  ]);

  assert.deepEqual(positions.map((position) => position.x), [0, 0.25, 1]);
  assert.equal(storyMarkers[0].x, positions[1].x);
});

test("equal or invalid endpoint timestamps retain a safe evenly spaced price line", async () => {
  const [equalTimes, invalidEndpoint] = await Promise.all([
    timeline([{ atMs: 5_000 }, { atMs: 5_000 }, { atMs: 5_000 }]),
    timeline([{ atMs: null }, { atMs: 5_000 }, { atMs: 10_000 }])
  ]);

  assert.deepEqual(equalTimes.map((position) => position.x), [0, 0.5, 1]);
  assert.deepEqual(invalidEndpoint.map((position) => position.x), [0, 0.5, 1]);
});

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
  assert.match(chart, /selectChartSamplePositions/);
  assert.match(chart, /chart-story-marker/);
  assert.match(chart, /role="button"/);
  assert.match(chart, /aria-label/);
  assert.match(chart, /onMouseEnter/);
  assert.match(chart, /onFocus/);
  assert.match(chart, /activeMarker\.update\.summary/);
  assert.match(chart, /relatedAssetIds\?\.includes\(asset\.id\)/);
  assert.match(app, /selectRelevantMarketStoryUpdates/);
});
