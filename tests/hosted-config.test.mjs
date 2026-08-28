import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("hosted authority accepts the Vercel Supabase POSTGRES_URL integration variable", async () => {
  const source = await readFile(new URL("../api/_authority.ts", import.meta.url), "utf8");
  assert.match(source, /process\.env\.POSTGRES_URL/);
});
