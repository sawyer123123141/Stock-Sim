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

async function sellQuickFillQuantity(ownedQuantity, shortcut) {
  const code = [
    `import { sellQuickFillQuantity } from ${JSON.stringify(stateModuleUrl)};`,
    `console.log(JSON.stringify(sellQuickFillQuantity(${ownedQuantity}, ${JSON.stringify(shortcut)})));`
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

test("sell quick fills calculate percentages and exact ALL quantities", async () => {
  assert.equal(await sellQuickFillQuantity(200, 25), 50);
  assert.equal(await sellQuickFillQuantity(200, 50), 100);
  assert.equal(await sellQuickFillQuantity(200, 75), 150);
  assert.equal(await sellQuickFillQuantity(201, "all"), 201);
});

test("sell quick fills round down and leave unavailable small percentages unset", async () => {
  assert.equal(await sellQuickFillQuantity(3, 25), null);
  assert.equal(await sellQuickFillQuantity(3, 50), 1);
  assert.equal(await sellQuickFillQuantity(3, 75), 2);
  assert.equal(await sellQuickFillQuantity(1, 25), null);
  assert.equal(await sellQuickFillQuantity(1, 50), null);
  assert.equal(await sellQuickFillQuantity(1, 75), null);
  assert.equal(await sellQuickFillQuantity(1, "all"), 1);
});

test("TradeTicket keeps shortcuts in Sell mode and preserves oversell validation", async () => {
  const ticket = await readFile(new URL("../apps/web/src/components/TradeTicket.tsx", import.meta.url), "utf8");

  assert.match(ticket, /side === "sell" && \(/);
  assert.match(ticket, /You own/);
  assert.match(ticket, /SELL_QUICK_FILL_SHORTCUTS/);
  assert.match(ticket, /shortcut === "all" \? "ALL"/);
  assert.match(ticket, /sellQuickFillQuantity\(ownedQuantity, shortcut\)/);
  assert.match(ticket, /disabled=\{quickFillQuantity === null\}/);
  assert.match(ticket, /quantity > ownedQuantity/);
});
