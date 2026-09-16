import { test } from "node:test";
import assert from "node:assert/strict";
import { api, authAsSuperuser, createBranchStaffUser, unique } from "./helpers.mjs";

test("superuser can authenticate", async () => {
  const token = await authAsSuperuser();
  assert.ok(token.length > 20);
});

test("admin user can create a branch; staff user cannot", async () => {
  const superToken = await authAsSuperuser();
  const admin = await createBranchStaffUser(superToken, { role: "admin" });
  const staffUser = await createBranchStaffUser(superToken, { role: "staff" });

  const asAdmin = await api("POST", "/api/collections/branches/records", {
    token: admin.token,
    body: { name: unique("AdminBranch"), is_active: true },
  });
  assert.equal(asAdmin.status, 200, JSON.stringify(asAdmin.json));

  const asStaff = await api("POST", "/api/collections/branches/records", {
    token: staffUser.token,
    body: { name: unique("StaffBranch"), is_active: true },
  });
  // PocketBase denies a failed createRule as a generic 400, not 403.
  assert.equal(asStaff.status, 400);
});

test("any authenticated user can list branches; anonymous cannot", async () => {
  const superToken = await authAsSuperuser();
  const staffUser = await createBranchStaffUser(superToken, { role: "staff" });

  const asStaff = await api("GET", "/api/collections/branches/records", { token: staffUser.token });
  assert.equal(asStaff.status, 200);
  assert.ok(Array.isArray(asStaff.json.items));

  const anon = await api("GET", "/api/collections/branches/records");
  assert.equal(anon.status, 200);
  assert.equal(anon.json.items.length, 0, "anonymous list should be filtered to zero by the rule");
});

test("staff collection is listable by any authenticated user but not writable by staff role", async () => {
  const superToken = await authAsSuperuser();
  const staffUser = await createBranchStaffUser(superToken, { role: "staff" });

  const list = await api("GET", "/api/collections/staff/records", { token: staffUser.token });
  assert.equal(list.status, 200);

  const create = await api("POST", "/api/collections/staff/records", {
    token: staffUser.token,
    body: { name: unique("NewStaff"), branch: staffUser.branch.id, is_active: true },
  });
  assert.equal(create.status, 400);
});
