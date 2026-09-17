import { test } from "node:test";
import assert from "node:assert/strict";
import { api, authAsSuperuser } from "./helpers.mjs";

// Regression guard for the gap real device testing found: only Gajuwaka had a
// seeded staff member, so every other branch's Staff dropdown (Price Tag,
// Estimate, Coupon, Calculator, Register, Transit Sheet) was empty.
// 1700000024_relax_products_create_and_seed_staff.js seeded the rest.
test("every seeded branch has at least one active staff member who can log in", async () => {
  const superToken = await authAsSuperuser();

  const branches = await api("GET", "/api/collections/branches/records?perPage=100", { token: superToken });
  assert.equal(branches.status, 200);
  assert.ok(branches.json.items.length > 0, "expected at least one seeded branch");

  const staff = await api("GET", "/api/collections/staff/records?perPage=100", { token: superToken });
  assert.equal(staff.status, 200);

  for (const branch of branches.json.items) {
    const branchStaff = staff.json.items.filter((s) => s.branch === branch.id && s.is_active);
    assert.ok(branchStaff.length > 0, `branch "${branch.name}" has no active staff member`);
  }
});

test("every seeded staff member (not just Admin) logs in with PIN 1234", async () => {
  const superToken = await authAsSuperuser();
  const staff = await api("GET", "/api/collections/staff/records?perPage=100", { token: superToken });

  // Scoped to the fixed seed-data names (1700000022/1700000024), not every
  // staff row in the DB — other tests in this same shared run create their
  // own ad-hoc staff via createBranchStaffUser with unrelated/no PINs.
  const seededNames = ["Admin", "Staff", "Staff (Kurmannapalem)", "Staff (Gajuwaka Packing)", "Staff (Kurmannapalem Packing)"];
  const seeded = staff.json.items.filter((s) => seededNames.includes(s.name));
  assert.equal(seeded.length, seededNames.length, "expected all 5 seeded staff records to exist");

  for (const s of seeded) {
    const login = await api("POST", "/api/staff-login", { body: { staff_id: s.id, pin: "1234" } });
    assert.equal(login.status, 200, `staff "${s.name}" should log in with PIN 1234: ${JSON.stringify(login.json)}`);
  }
});
