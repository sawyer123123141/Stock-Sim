import test from "node:test";
import assert from "node:assert/strict";
import WebSocket from "ws";
import { createSeedMarket } from "../dist/packages/sim/src/fixtures.js";
import { createMarketRuntime } from "../dist/apps/server/src/marketRuntime.js";
import { buildMarketApp } from "../dist/apps/server/src/app.js";

function openSocket(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    socket.once("open", () => resolve(socket));
    socket.once("error", reject);
  });
}

function nextJsonMessage(socket) {
  return new Promise((resolve, reject) => {
    socket.once("message", (data) => {
      try {
        resolve(JSON.parse(data.toString()));
      } catch (error) {
        reject(error);
      }
    });
    socket.once("error", reject);
  });
}

test("/ws/market sends the current snapshot and future authoritative updates", async () => {
  const runtime = createMarketRuntime({
    initialState: createSeedMarket(),
    seed: 321,
    startedAtMs: 1_000
  });
  const app = buildMarketApp({ runtime });
  let socket;

  await app.listen({ host: "127.0.0.1", port: 0 });

  try {
    const address = app.server.address();
    assert.ok(address && typeof address !== "string");

    socket = await openSocket(`ws://127.0.0.1:${address.port}/ws/market`);
    const initial = await nextJsonMessage(socket);
    assert.deepEqual(initial, runtime.snapshot());

    const updatePromise = nextJsonMessage(socket);
    const expected = runtime.advanceTo(6_000);
    const update = await updatePromise;
    assert.deepEqual(update, expected);
  } finally {
    if (socket && socket.readyState !== WebSocket.CLOSED) socket.terminate();
    await app.close();
  }
});
