import test from "node:test";
import assert from "node:assert/strict";

const progressModule = new URL("../dist/apps/web/src/firstSessionProgress.js", import.meta.url);

test("first-session asset progress remembers assets even after they are sold", async () => {
  const { rememberOwnedAssetIds } = await import(progressModule.href);

  const afterNova = rememberOwnedAssetIds([], [
    { assetId: "nova", quantity: 1 }
  ]);
  const afterSwitchingPositions = rememberOwnedAssetIds(afterNova, [
    { assetId: "luma", quantity: 2 }
  ]);

  assert.deepEqual(afterNova, ["nova"]);
  assert.deepEqual(afterSwitchingPositions, ["nova", "luma"]);
});

test("first-session asset progress ignores empty positions and stays duplicate-free", async () => {
  const { rememberOwnedAssetIds } = await import(progressModule.href);

  const result = rememberOwnedAssetIds(["nova"], [
    { assetId: "nova", quantity: 3 },
    { assetId: "luma", quantity: 0 }
  ]);

  assert.deepEqual(result, ["nova"]);
});
