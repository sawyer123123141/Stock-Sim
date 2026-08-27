import test from "node:test";
import assert from "node:assert/strict";
import { InMemoryPortfolioStore } from "../dist/apps/server/src/portfolioStore.js";

test("async portfolio transactions stay serialized until the mutation finishes", async () => {
  const store = new InMemoryPortfolioStore();
  let releaseFirst;
  const firstGate = new Promise((resolve) => {
    releaseFirst = resolve;
  });
  let secondStarted = false;

  const first = store.transact("demo-player", async (portfolio) => {
    portfolio.cashCents -= 100;
    await firstGate;
    portfolio.cashCents -= 100;
  });

  const second = store.transact("demo-player", (portfolio) => {
    secondStarted = true;
    portfolio.cashCents -= 300;
  });

  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(secondStarted, false);

  releaseFirst();
  await Promise.all([first, second]);

  const portfolio = await store.read("demo-player");
  assert.equal(portfolio.cashCents, 999_500);
});

test("a rejected async portfolio transaction rolls back its working copy", async () => {
  const store = new InMemoryPortfolioStore();
  const before = await store.read("demo-player");

  await assert.rejects(
    () => store.transact("demo-player", async (portfolio) => {
      portfolio.cashCents -= 500;
      await Promise.resolve();
      throw new Error("rollback");
    }),
    /rollback/
  );

  assert.deepEqual(await store.read("demo-player"), before);
});
