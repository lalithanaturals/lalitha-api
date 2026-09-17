import { test } from "node:test";
import assert from "node:assert/strict";
import { api, authAsSuperuser, createBranchStaffUser, unique } from "./helpers.mjs";

test("staff list is public but the pin field is never exposed", async () => {
  const superToken = await authAsSuperuser();
  await createBranchStaffUser(superToken, { pin: "1111" });

  const anon = await api("GET", "/api/collections/staff/records");
  assert.equal(anon.status, 200);
  assert.ok(anon.json.items.length > 0);
  for (const item of anon.json.items) {
    assert.equal(item.pin, undefined, "pin must be hidden from every API response");
  }
});

test("POST /api/staff-login issues a working token for the correct PIN", async () => {
  const superToken = await authAsSuperuser();
  const { staff } = await createBranchStaffUser(superToken, { pin: "2222" });

  const login = await api("POST", "/api/staff-login", { body: { staff_id: staff.id, pin: "2222" } });
  assert.equal(login.status, 200, JSON.stringify(login.json));
  assert.ok(login.json.token.length > 20);
  assert.equal(login.json.record.staff, staff.id);

  const asLoggedIn = await api("GET", "/api/collections/branches/records", { token: login.json.token });
  assert.equal(asLoggedIn.status, 200);
});

test("POST /api/staff-login rejects a wrong PIN", async () => {
  const superToken = await authAsSuperuser();
  const { staff } = await createBranchStaffUser(superToken, { pin: "3333" });

  const login = await api("POST", "/api/staff-login", { body: { staff_id: staff.id, pin: "0000" } });
  assert.equal(login.status, 400);
});

test("POST /api/staff-login rejects an inactive staff member", async () => {
  const superToken = await authAsSuperuser();
  const { staff } = await createBranchStaffUser(superToken, { pin: "4444" });

  const deactivate = await api("PATCH", `/api/collections/staff/records/${staff.id}`, {
    token: superToken,
    body: { is_active: false },
  });
  assert.equal(deactivate.status, 200);

  const login = await api("POST", "/api/staff-login", { body: { staff_id: staff.id, pin: "4444" } });
  assert.equal(login.status, 400);
});

test("POST /api/staff-login requires both fields", async () => {
  const missingPin = await api("POST", "/api/staff-login", { body: { staff_id: unique("nope") } });
  assert.equal(missingPin.status, 400);
});
