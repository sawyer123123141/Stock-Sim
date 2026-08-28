import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

test("the selected asset renders a compact semantic Market Pulse", async () => {
  const [app, pulse] = await Promise.all([
    readFile(new URL("apps/web/src/App.tsx", root), "utf8"),
    readFile(new URL("apps/web/src/components/MarketPulse.tsx", root), "utf8")
  ]);

  assert.match(app, /<MarketPulse/);
  assert.match(pulse, /MARKET PULSE/);
  assert.match(pulse, /Risk/);
  assert.match(pulse, /Short-term pressure/);
  assert.match(pulse, /<dt>/);
  assert.match(pulse, /<dd>/);
  assert.match(pulse, /Slightly upward/);
  assert.match(pulse, /Balanced/);
});
