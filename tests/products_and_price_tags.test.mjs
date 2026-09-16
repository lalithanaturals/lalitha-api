import { test } from "node:test";
import assert from "node:assert/strict";
import { api, authAsSuperuser, createBranchStaffUser, unique } from "./helpers.mjs";

async function makeProduct(token) {
  const res = await api("POST", "/api/collections/products/records", {
    token,
    body: { brand_name: unique("Brand"), default_price: 100 },
  });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  return res.json;
}

test("staff cannot create products, admin can", async () => {
  const superToken = await authAsSuperuser();
  const admin = await createBranchStaffUser(superToken, { role: "admin" });
  const staff = await createBranchStaffUser(superToken, { role: "staff" });

  const asStaff = await api("POST", "/api/collections/products/records", {
    token: staff.token,
    body: { brand_name: unique("Brand"), default_price: 50 },
  });
  assert.equal(asStaff.status, 400);

  const asAdmin = await makeProduct(admin.token);
  assert.ok(asAdmin.id);
});

test("staff can create a price tag for their own branch", async () => {
  const superToken = await authAsSuperuser();
  const admin = await createBranchStaffUser(superToken, { role: "admin" });
  const staff = await createBranchStaffUser(superToken, { role: "staff" });
  const product = await makeProduct(admin.token);

  const create = await api("POST", "/api/collections/price_tags/records", {
    token: staff.token,
    body: {
      product: product.id,
      mrp: 250,
      discount_type: "percent",
      discount_value: 10,
      final_price: 225,
      layout: "standard",
      branch: staff.branch.id,
      staff: staff.staff.id,
    },
  });
  assert.equal(create.status, 200, JSON.stringify(create.json));
  assert.equal(create.json.final_price, 225);
});

test("staff cannot update a price tag belonging to a different branch", async () => {
  const superToken = await authAsSuperuser();
  const admin = await createBranchStaffUser(superToken, { role: "admin" });
  const staffA = await createBranchStaffUser(superToken, { role: "staff" });
  const staffB = await createBranchStaffUser(superToken, { role: "staff" });
  const product = await makeProduct(admin.token);

  const created = await api("POST", "/api/collections/price_tags/records", {
    token: staffA.token,
    body: {
      product: product.id,
      mrp: 100,
      final_price: 100,
      branch: staffA.branch.id,
      staff: staffA.staff.id,
    },
  });
  assert.equal(created.status, 200);

  const crossUpdate = await api("PATCH", `/api/collections/price_tags/records/${created.json.id}`, {
    token: staffB.token,
    body: { final_price: 1 },
  });
  assert.equal(crossUpdate.status, 404, "branch-scoped rule should hide the record, not just forbid writes");

  const adminUpdate = await api("PATCH", `/api/collections/price_tags/records/${created.json.id}`, {
    token: admin.token,
    body: { final_price: 90 },
  });
  assert.equal(adminUpdate.status, 200);
  assert.equal(adminUpdate.json.final_price, 90);
});
