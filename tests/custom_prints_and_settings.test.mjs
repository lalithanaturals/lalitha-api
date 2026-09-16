import { test } from "node:test";
import assert from "node:assert/strict";
import { api, authAsSuperuser, createBranchStaffUser, unique } from "./helpers.mjs";

test("custom_prints stores arbitrary JSON content", async () => {
  const superToken = await authAsSuperuser();
  const staff = await createBranchStaffUser(superToken, { role: "staff" });

  const content = { text: "Happy Diwali!", font: "Arial", align: "center", bold: true };
  const res = await api("POST", "/api/collections/custom_prints/records", {
    token: staff.token,
    body: {
      print_type: "custom_text",
      content,
      branch: staff.branch.id,
      staff: staff.staff.id,
    },
  });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  assert.deepEqual(res.json.content, content);
});

test("custom_prints rejects an invalid print_type", async () => {
  const superToken = await authAsSuperuser();
  const staff = await createBranchStaffUser(superToken, { role: "staff" });

  const res = await api("POST", "/api/collections/custom_prints/records", {
    token: staff.token,
    body: {
      print_type: "not_a_real_type",
      content: {},
      branch: staff.branch.id,
      staff: staff.staff.id,
    },
  });
  assert.equal(res.status, 400);
});

test("settings: admin can set a unique key, duplicate key is rejected", async () => {
  const superToken = await authAsSuperuser();
  const admin = await createBranchStaffUser(superToken, { role: "admin" });
  const key = unique("logo_key");

  const first = await api("POST", "/api/collections/settings/records", {
    token: admin.token,
    body: { key, value: "https://example.com/logo.png" },
  });
  assert.equal(first.status, 200, JSON.stringify(first.json));

  const duplicate = await api("POST", "/api/collections/settings/records", {
    token: admin.token,
    body: { key, value: "https://example.com/other.png" },
  });
  assert.equal(duplicate.status, 400);
});

test("settings: staff can read but not write", async () => {
  const superToken = await authAsSuperuser();
  const staff = await createBranchStaffUser(superToken, { role: "staff" });

  const list = await api("GET", "/api/collections/settings/records", { token: staff.token });
  assert.equal(list.status, 200);

  const write = await api("POST", "/api/collections/settings/records", {
    token: staff.token,
    body: { key: unique("blocked_key"), value: "x" },
  });
  assert.equal(write.status, 400);
});
