import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);

test("the selected asset renders a compact qualitative Market Read", async () => {
  const [app, read] = await Promise.all([
    readFile(new URL("apps/web/src/App.tsx", root), "utf8"),
    readFile(new URL("apps/web/src/components/MarketRead.tsx", root), "utf8")
  ]);

  assert.match(app, /<MarketRead/);
  assert.match(read, /MARKET READ/);
  assert.match(read, /Buyers have a slight edge/);
  assert.match(read, /Sellers have a slight edge/);
  assert.match(read, /Buyers and sellers are fairly balanced/);
  assert.match(read, /Price movement is fairly calm/);
  assert.match(read, /Price movement is active/);
  assert.match(read, /Price movement is elevated/);
  assert.doesNotMatch(read, /likely to rise|risk|pressure value/i);
});
