import test from "node:test";
import assert from "node:assert/strict";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";

const execFile = promisify(execFileCallback);
const selectorModule = new URL("../apps/web/src/marketEventSelection.ts", import.meta.url);

async function selectEvent(asset, events) {
  const { stdout } = await execFile(process.execPath, [
    "--no-warnings",
    "--experimental-strip-types",
    "--input-type=module",
    "--eval",
    `import { selectRelevantMarketEvent } from ${JSON.stringify(selectorModule.href)}; console.log(JSON.stringify(selectRelevantMarketEvent(${JSON.stringify(asset)}, ${JSON.stringify(events)})));`
  ]);

  return JSON.parse(stdout);
}

test("the client selects the most relevant public event for the selected asset", async () => {
  const selected = await selectEvent(
    { id: "nova", sector: "Mobility" },
    [
      { id: "global", target: { kind: "global" }, publishedAt: "2026-01-01T00:00:00.000Z" },
      { id: "sector", target: { kind: "sector", value: "Mobility" }, publishedAt: "2026-01-01T00:01:00.000Z" },
      { id: "asset", target: { kind: "asset", value: "nova" }, publishedAt: "2026-01-01T00:02:00.000Z" }
    ]
  );

  assert.equal(selected.id, "asset");
});
