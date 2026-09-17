import { test } from "node:test";
import assert from "node:assert/strict";
import { api, authAsSuperuser, createBranchStaffUser } from "./helpers.mjs";

test("creates a draft audit register and commits it", async () => {
  const superToken = await authAsSuperuser();
  const staff = await createBranchStaffUser(superToken, { role: "staff" });

  const created = await api("POST", "/api/collections/audit_registers/records", {
    token: staff.token,
    body: {
      date: "2026-09-17 00:00:00.000Z",
      branch: staff.branch.id,
      opening_balance: 4851,
      denomination_counts: { "500": 4, "200": 2, "100": 1 },
      cash_total: 2500,
      status: "draft",
    },
  });
  assert.equal(created.status, 200, JSON.stringify(created.json));
  assert.equal(created.json.status, "draft");

  const committed = await api("PATCH", `/api/collections/audit_registers/records/${created.json.id}`, {
    token: staff.token,
    body: { status: "committed", closing_balance: 2500, committed_by: staff.staff.id },
  });
  assert.equal(committed.status, 200);
  assert.equal(committed.json.status, "committed");
  assert.equal(committed.json.committed_by, staff.staff.id);
});

test("enforces one audit register per (branch, date)", async () => {
  const superToken = await authAsSuperuser();
  const staff = await createBranchStaffUser(superToken, { role: "staff" });

  const first = await api("POST", "/api/collections/audit_registers/records", {
    token: staff.token,
    body: { date: "2026-09-18 00:00:00.000Z", branch: staff.branch.id, status: "draft" },
  });
  assert.equal(first.status, 200);

  const duplicate = await api("POST", "/api/collections/audit_registers/records", {
    token: staff.token,
    body: { date: "2026-09-18 00:00:00.000Z", branch: staff.branch.id, status: "draft" },
  });
  assert.equal(duplicate.status, 400);
});

test("opening balance chaining: query yesterday's closing balance for the branch", async () => {
  const superToken = await authAsSuperuser();
  const staff = await createBranchStaffUser(superToken, { role: "staff" });

  const yesterday = await api("POST", "/api/collections/audit_registers/records", {
    token: staff.token,
    body: {
      date: "2026-09-16 00:00:00.000Z",
      branch: staff.branch.id,
      status: "committed",
      closing_balance: 3210,
    },
  });
  assert.equal(yesterday.status, 200);

  const found = await api(
    "GET",
    `/api/collections/audit_registers/records?filter=${encodeURIComponent(
      `branch = "${staff.branch.id}" && date = "2026-09-16 00:00:00.000Z"`,
    )}&sort=-date`,
    { token: staff.token },
  );
  assert.equal(found.json.items.length, 1);
  assert.equal(found.json.items[0].closing_balance, 3210);
});

test("audit_line_items: creation and cascade-delete with the parent register", async () => {
  const superToken = await authAsSuperuser();
  const staff = await createBranchStaffUser(superToken, { role: "staff" });

  const register = await api("POST", "/api/collections/audit_registers/records", {
    token: staff.token,
    body: { date: "2026-09-19 00:00:00.000Z", branch: staff.branch.id, status: "draft" },
  });
  assert.equal(register.status, 200);

  const item = await api("POST", "/api/collections/audit_line_items/records", {
    token: staff.token,
    body: {
      audit_register: register.json.id,
      category: "expense",
      name: "Electricity bill",
      amount: 450,
    },
  });
  assert.equal(item.status, 200);

  const del = await api("DELETE", `/api/collections/audit_registers/records/${register.json.id}`, {
    token: staff.token,
  });
  assert.equal(del.status, 204);

  const itemsAfter = await api(
    "GET",
    `/api/collections/audit_line_items/records?filter=(audit_register='${register.json.id}')`,
    { token: staff.token },
  );
  assert.equal(itemsAfter.json.items.length, 0);
});

test("staff cannot update an audit register belonging to a different branch", async () => {
  const superToken = await authAsSuperuser();
  const staffA = await createBranchStaffUser(superToken, { role: "staff" });
  const staffB = await createBranchStaffUser(superToken, { role: "staff" });

  const created = await api("POST", "/api/collections/audit_registers/records", {
    token: staffA.token,
    body: { date: "2026-09-20 00:00:00.000Z", branch: staffA.branch.id, status: "draft" },
  });
  assert.equal(created.status, 200);

  const blocked = await api("PATCH", `/api/collections/audit_registers/records/${created.json.id}`, {
    token: staffB.token,
    body: { status: "committed" },
  });
  assert.equal(blocked.status, 404);
});
