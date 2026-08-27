import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const stateModuleUrl = new URL("../apps/web/src/tradeTicketState.ts", import.meta.url).href;

async function finalSaleReset(assetId, lastFill, ownedQuantity) {
  const code = [
    `import { finalSaleTicketReset } from ${JSON.stringify(stateModuleUrl)};`,
    `console.log(JSON.stringify(finalSaleTicketReset(${JSON.stringify(assetId)}, ${JSON.stringify(lastFill)}, ${ownedQuantity})));`
  ].join("\n");
  const { stdout } = await execFileAsync(process.execPath, [
    "--no-warnings",
    "--experimental-strip-types",
    "--input-type=module",
    "--eval",
    code
  ]);
  return JSON.parse(stdout);
}

test("changing assets gives TradeTicket a fresh local-state key", async () => {
  const app = await readFile(new URL("../apps/web/src/App.tsx", import.meta.url), "utf8");

  assert.match(app, /<TradeTicket\s+key=\{asset\.id\}/);
});

test("a final successful sell resets TradeTicket to Buy with quantity 1", async () => {
  const finalSale = await finalSaleReset("nova", {
    id: "trade-7",
    assetId: "nova",
    symbol: "NOVA",
    side: "sell",
    quantity: 1,
    unitPrice: 42.15,
    total: 42.15,
    executedAt: "2026-08-27T00:00:00.000Z"
  }, 0);

  assert.deepEqual(finalSale, { side: "buy", quantityText: "1" });
});

test("a partial successful sell does not reset TradeTicket", async () => {
  const partialSale = await finalSaleReset("nova", {
    id: "trade-8",
    assetId: "nova",
    symbol: "NOVA",
    side: "sell",
    quantity: 1,
    unitPrice: 42.15,
    total: 42.15,
    executedAt: "2026-08-27T00:00:00.000Z"
  }, 1);

  assert.equal(partialSale, null);
});

test("a failed trade does not reset TradeTicket", async () => {
  const failedTrade = await finalSaleReset("nova", null, 0);

  assert.equal(failedTrade, null);
});
