import test from "node:test";
import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const markersModule = new URL("../apps/web/src/priceChartMarkers.ts", import.meta.url);
const selectionModule = new URL("../apps/web/src/marketEventSelection.ts", import.meta.url);

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

async function archiveRequest(samples, recentStoryWindowMs = 1_800_000) {
  const { stdout } = await execFile(process.execPath, [
    "--no-warnings",
    "--experimental-strip-types",
    "--input-type=module",
    "--eval",
    `const module = await import(${JSON.stringify(markersModule.href)}); console.log(JSON.stringify(module.selectChartArchiveRequest?.(${JSON.stringify(samples)}, ${JSON.stringify(recentStoryWindowMs)}) ?? null));`
  ]);
  return JSON.parse(stdout);
}

async function mergeUpdates(live, archived) {
  const { stdout } = await execFile(process.execPath, [
    "--no-warnings",
    "--experimental-strip-types",
    "--input-type=module",
    "--eval",
    `const module = await import(${JSON.stringify(markersModule.href)}); console.log(JSON.stringify(module.mergeChartStoryUpdates?.(${JSON.stringify(live)}, ${JSON.stringify(archived)}) ?? []));`
  ]);
  return JSON.parse(stdout);
}

async function archiveScopeKey(assetId, request) {
  const { stdout } = await execFile(process.execPath, [
    "--no-warnings",
    "--experimental-strip-types",
    "--input-type=module",
    "--eval",
    `const module = await import(${JSON.stringify(markersModule.href)}); console.log(JSON.stringify(module.chartArchiveScopeKey?.(${JSON.stringify(assetId)}, ${JSON.stringify(request)}) ?? null));`
  ]);
  return JSON.parse(stdout);
}

async function scopedArchiveUpdates(currentScopeKey, storedContext) {
  const { stdout } = await execFile(process.execPath, [
    "--no-warnings",
    "--experimental-strip-types",
    "--input-type=module",
    "--eval",
    `const module = await import(${JSON.stringify(markersModule.href)}); console.log(JSON.stringify(module.selectScopedChartArchiveUpdates?.(${JSON.stringify(currentScopeKey)}, ${JSON.stringify(storedContext)}) ?? []));`
  ]);
  return JSON.parse(stdout);
}

async function relevantUpdates(asset, stories) {
  const { stdout } = await execFile(process.execPath, [
    "--no-warnings",
    "--experimental-strip-types",
    "--input-type=module",
    "--eval",
    `import { selectRelevantMarketStoryUpdates } from ${JSON.stringify(selectionModule.href)}; console.log(JSON.stringify(selectRelevantMarketStoryUpdates(${JSON.stringify(asset)}, ${JSON.stringify(stories)})));`
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

test("only a visible range extending beyond live story context requests bounded archive markers", async () => {
  const [shortSession, longSession] = await Promise.all([
    archiveRequest([{ atMs: 0 }, { atMs: 5_000 }]),
    archiveRequest([{ atMs: 0 }, { atMs: 1_900_000 }])
  ]);

  assert.equal(shortSession, null);
  assert.deepEqual(longSession, { fromMs: 0, toMs: 1_920_000 });
});

test("live and archived marker inputs deduplicate stable public update IDs", async () => {
  const merged = await mergeUpdates(
    [{ id: "shared", title: "Live", summary: "Live copy", publishedAt: "1970-01-01T00:00:05.000Z" }],
    [{ id: "shared", title: "Archive", summary: "Archive copy", publishedAt: "1970-01-01T00:00:05.000Z" }, {
      id: "archive-only", title: "Archive only", summary: "Historical context", publishedAt: "1970-01-01T00:00:06.000Z"
    }]
  );

  assert.deepEqual(merged.map((update) => update.id), ["shared", "archive-only"]);
  assert.equal(merged[0].title, "Live");
});

test("archive marker cache is eligible only for its exact asset and rounded range scope", async () => {
  const request = { fromMs: 0, toMs: 1_920_000 };
  const [novaScope, lumaScope, shiftedNovaScope] = await Promise.all([
    archiveScopeKey("nova", request),
    archiveScopeKey("luma", request),
    archiveScopeKey("nova", { fromMs: 60_000, toMs: 1_980_000 })
  ]);
  const stored = { scopeKey: novaScope, updates: [{ id: "nova-archive", title: "NOVA archive", summary: "", publishedAt: "1970-01-01T00:00:05.000Z" }] };
  const [matching, wrongAsset, wrongRange, noRequest] = await Promise.all([
    scopedArchiveUpdates(novaScope, stored),
    scopedArchiveUpdates(lumaScope, stored),
    scopedArchiveUpdates(shiftedNovaScope, stored),
    scopedArchiveUpdates(null, stored)
  ]);

  assert.deepEqual(matching.map((update) => update.id), ["nova-archive"]);
  assert.deepEqual(wrongAsset, []);
  assert.deepEqual(wrongRange, []);
  assert.deepEqual(noRequest, []);
});

test("related-company archived chart context keeps only updates that affected the selected asset", async () => {
  const updates = await relevantUpdates(
    { id: "nova", sector: "Mobility" },
    [{
      id: "luma-archive",
      title: "LUMA history",
      target: { kind: "asset", value: "luma" },
      status: "resolved",
      lifecycle: "archive",
      updates: [{ id: "affects-nova", title: "NOVA context", summary: "", publishedAt: "1970-01-01T00:00:05.000Z", relatedAssetIds: ["nova"] }, {
        id: "does-not-affect-nova", title: "Other context", summary: "", publishedAt: "1970-01-01T00:00:06.000Z", relatedAssetIds: ["hgrid"]
      }]
    }]
  );

  assert.deepEqual(updates.map((update) => update.id), ["affects-nova"]);
});

test("the price chart renders neutral accessible public-information markers", async () => {
  const root = new URL("../", import.meta.url);
  const [chart, app] = await Promise.all([
    readFile(new URL("apps/web/src/components/PriceChart.tsx", root), "utf8"),
    readFile(new URL("apps/web/src/App.tsx", root), "utf8")
  ]);

  assert.match(chart, /selectChartStoryMarkers/);
  assert.match(chart, /selectChartSamplePositions/);
  assert.match(chart, /selectChartArchiveRequest/);
  assert.match(chart, /chartArchiveScopeKey/);
  assert.match(chart, /selectScopedChartArchiveUpdates/);
  assert.match(chart, /fetchStoryHistory/);
  assert.match(chart, /mergeChartStoryUpdates/);
  assert.match(chart, /chart-story-marker/);
  assert.match(chart, /role="button"/);
  assert.match(chart, /aria-label/);
  assert.match(chart, /onMouseEnter/);
  assert.match(chart, /onFocus/);
  assert.match(chart, /activeMarker\.update\.summary/);
  assert.match(chart, /relatedAssetIds\?\.includes\(asset\.id\)/);
  assert.match(app, /selectRelevantMarketStoryUpdates/);
});
