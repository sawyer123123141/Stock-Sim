import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const formatterModule = new URL("../apps/web/src/format.ts", import.meta.url);

async function formatMarketChange(value) {
  const { stdout } = await execFileAsync(process.execPath, [
    "--no-warnings",
    "--experimental-strip-types",
    "--input-type=module",
    "--eval",
    `import { formatSignedPercent } from ${JSON.stringify(formatterModule.href)}; console.log(formatSignedPercent(${value}));`
  ]);

  return stdout.trim();
}

async function marketChangeTone(value) {
  const { stdout } = await execFileAsync(process.execPath, [
    "--no-warnings",
    "--experimental-strip-types",
    "--input-type=module",
    "--eval",
    `import { marketChangeTone } from ${JSON.stringify(formatterModule.href)}; console.log(marketChangeTone(${value}));`
  ]);

  return stdout.trim();
}

async function marketChangeDescription(value) {
  const { stdout } = await execFileAsync(process.execPath, [
    "--no-warnings",
    "--experimental-strip-types",
    "--input-type=module",
    "--eval",
    `import * as formatter from ${JSON.stringify(formatterModule.href)}; console.log(formatter.describeMarketChange?.(${value}) ?? "missing");`
  ]);

  return stdout.trim();
}

test("percentages that round to zero do not display a negative zero", async () => {
  assert.equal(await formatMarketChange(-0.0001), "0.00%");
  assert.equal(await formatMarketChange(0.0001), "0.00%");
});

test("percentages that round to zero use a neutral tone", async () => {
  assert.equal(await marketChangeTone(-0.0001), "neutral");
  assert.equal(await marketChangeTone(0), "neutral");
  assert.equal(await marketChangeTone(0.01), "up");
  assert.equal(await marketChangeTone(-0.01), "down");
});

test("market change descriptions convey direction without relying on color", async () => {
  assert.equal(await marketChangeDescription(1.2), "up 1.20%");
  assert.equal(await marketChangeDescription(-1.2), "down 1.20%");
  assert.equal(await marketChangeDescription(-0.0001), "unchanged at 0.00%");
});
