import test from "node:test";
import assert from "node:assert/strict";

const snapshotStateModule = new URL(
  "../dist/apps/web/src/marketSnapshotState.js",
  import.meta.url
);

function snapshot(generatedAt, novaPrice) {
  return {
    sequence: Date.parse(generatedAt),
    generatedAt,
    assets: [
      {
        id: "nova",
        symbol: "NOVA",
        name: "Nova Motors",
        kind: "stock",
        price: novaPrice,
        lastTickChangePct: 0,
        reasons: []
      }
    ]
  };
}

async function apply(state, incoming) {
  const { applyMarketSnapshot } = await import(snapshotStateModule.href);
  return applyMarketSnapshot(state, incoming);
}

test("ignores an older HTTP snapshot after a newer WebSocket snapshot", async () => {
  const newer = snapshot("2026-08-27T15:01:00.000Z", 42);
  const older = snapshot("2026-08-27T15:00:00.000Z", 40);
  const afterNewer = await apply({ market: null, priceHistory: {} }, newer);
  const result = await apply(afterNewer, older);

  assert.equal(result.market, newer);
  assert.deepEqual(result.priceHistory.nova, [
    { atMs: Date.parse(newer.generatedAt), price: 42 }
  ]);
});

test("does not add history twice for snapshots with the same generated time", async () => {
  const current = snapshot("2026-08-27T15:00:00.000Z", 40);
  const afterFirst = await apply({ market: null, priceHistory: {} }, current);
  const result = await apply(afterFirst, current);

  assert.deepEqual(result.priceHistory.nova, [
    { atMs: Date.parse(current.generatedAt), price: 40 }
  ]);
});

test("accepts a newer snapshot and appends one authoritative history point", async () => {
  const first = snapshot("2026-08-27T15:00:00.000Z", 40);
  const newer = snapshot("2026-08-27T15:01:00.000Z", 42);
  const afterFirst = await apply({ market: null, priceHistory: {} }, first);
  const result = await apply(afterFirst, newer);

  assert.equal(result.market, newer);
  assert.deepEqual(result.priceHistory.nova, [
    { atMs: Date.parse(first.generatedAt), price: 40 },
    { atMs: Date.parse(newer.generatedAt), price: 42 }
  ]);
});

test("keeps only the latest 120 authoritative history points", async () => {
  let state = { market: null, priceHistory: {} };

  for (let index = 0; index < 121; index += 1) {
    const generatedAt = new Date(Date.UTC(2026, 7, 27, 15, 0, index)).toISOString();
    state = await apply(state, snapshot(generatedAt, 40 + index));
  }

  assert.equal(state.priceHistory.nova.length, 120);
  assert.deepEqual(state.priceHistory.nova[0], {
    atMs: Date.parse("2026-08-27T15:00:01.000Z"),
    price: 41
  });
  assert.deepEqual(state.priceHistory.nova.at(-1), {
    atMs: Date.parse("2026-08-27T15:02:00.000Z"),
    price: 160
  });
});
