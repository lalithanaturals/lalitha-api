import { test } from "node:test";
import assert from "node:assert/strict";
import { api } from "./helpers.mjs";

test("GET /api/health returns ok", async () => {
  const { status, json } = await api("GET", "/api/health");
  assert.equal(status, 200);
  assert.equal(json.code, 200);
});
