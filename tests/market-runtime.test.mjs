import test from "node:test";
import assert from "node:assert/strict";
import { createSeedMarket } from "../dist/packages/sim/src/fixtures.js";
import { createMarketRuntime } from "../dist/apps/server/src/marketRuntime.js";

test("authoritative runtime advances only when market time moves forward", () => {
  const runtime = createMarketRuntime({
    initialState: createSeedMarket(),
    seed: 12345,
    startedAtMs: 1_000
  });

  assert.equal(runtime.snapshot().sequence, 0);
  assert.equal(runtime.advanceTo(1_000).sequence, 0);

  const advanced = runtime.advanceTo(6_000);
  assert.equal(advanced.sequence, 1);
  assert.equal(advanced.generatedAt, "1970-01-01T00:00:06.000Z");
});

test("authoritative runtime replays the same timeline for the same seed", () => {
  const makeRuntime = () => createMarketRuntime({
    initialState: createSeedMarket(),
    seed: 77,
    startedAtMs: 10_000
  });

  const a = makeRuntime();
  const b = makeRuntime();

  for (const nowMs of [15_000, 20_000, 30_000, 45_000]) {
    assert.deepEqual(a.advanceTo(nowMs), b.advanceTo(nowMs));
  }
});

test("subscribers receive snapshots only after successful advances", () => {
  const runtime = createMarketRuntime({
    initialState: createSeedMarket(),
    seed: 5,
    startedAtMs: 0
  });
  const sequences = [];
  const unsubscribe = runtime.subscribe((snapshot) => sequences.push(snapshot.sequence));

  runtime.advanceTo(5_000);
  runtime.advanceTo(10_000);
  unsubscribe();
  runtime.advanceTo(15_000);

  assert.deepEqual(sequences, [1, 2]);
});

test("start uses the injected clock and scheduler, and stop cancels future ticks", () => {
  let nowMs = 1_000;
  let scheduledTick;
  let cancelled = false;

  const runtime = createMarketRuntime({
    initialState: createSeedMarket(),
    seed: 9,
    clock: () => nowMs,
    tickIntervalMs: 5_000,
    scheduler: {
      every(intervalMs, tick) {
        assert.equal(intervalMs, 5_000);
        scheduledTick = tick;
        return () => {
          cancelled = true;
        };
      }
    }
  });

  runtime.start();
  assert.equal(runtime.snapshot().sequence, 0);

  nowMs = 6_000;
  scheduledTick();
  assert.equal(runtime.snapshot().sequence, 1);

  runtime.stop();
  assert.equal(cancelled, true);
});

test("runtime recovery preserves RNG, scheduled events, and player pressure", () => {
  const initial = createMarketRuntime({
    initialState: createSeedMarket(),
    seed: 42,
    startedAtMs: 0,
    firstEventDelayMs: 5_000,
    eventIntervalMs: 10_000
  });

  initial.advanceTo(5_000);
  initial.recordPlayerTrade("nova", "buy", 3, 5_000);
  const recovered = createMarketRuntime({ recoveryState: initial.recoveryState() });

  assert.deepEqual(recovered.advanceTo(15_000), initial.advanceTo(15_000));
  assert.equal(recovered.playerPressureForAsset("nova", 15_000), initial.playerPressureForAsset("nova", 15_000));
});
