import { test } from "node:test";
import assert from "node:assert/strict";
import { api, authAsSuperuser, createBranchStaffUser, unique } from "./helpers.mjs";

async function makeCategoryAndItem(token) {
  const category = (await api("POST", "/api/collections/inventory_categories/records", {
    token,
    body: { name: unique("Category") },
  })).json;
  const item = (await api("POST", "/api/collections/inventory_items/records", {
    token,
    body: {
      category: category.id,
      name: unique("Item"),
      code: unique("CODE"),
      uom: "pcs",
      min_limit: 5,
    },
  })).json;
  return { category, item };
}

test("staff cannot create inventory categories/items, admin can", async () => {
  const superToken = await authAsSuperuser();
  const admin = await createBranchStaffUser(superToken, { role: "admin" });
  const staff = await createBranchStaffUser(superToken, { role: "staff" });

  const asStaff = await api("POST", "/api/collections/inventory_categories/records", {
    token: staff.token,
    body: { name: unique("Category") },
  });
  assert.equal(asStaff.status, 400);

  const { item } = await makeCategoryAndItem(admin.token);
  assert.ok(item.id);
});

test("any authenticated staff can create/update stock counts for their branch", async () => {
  const superToken = await authAsSuperuser();
  const admin = await createBranchStaffUser(superToken, { role: "admin" });
  const staff = await createBranchStaffUser(superToken, { role: "staff" });
  const { item } = await makeCategoryAndItem(admin.token);

  const create = await api("POST", "/api/collections/inventory_stock/records", {
    token: staff.token,
    body: { item: item.id, branch: staff.branch.id, quantity: 10, updated_by: staff.staff.id },
  });
  assert.equal(create.status, 200, JSON.stringify(create.json));

  const update = await api("PATCH", `/api/collections/inventory_stock/records/${create.json.id}`, {
    token: staff.token,
    body: { quantity: 8 },
  });
  assert.equal(update.status, 200);
  assert.equal(update.json.quantity, 8);
});

test("inventory_stock enforces a unique (item, branch) pair", async () => {
  const superToken = await authAsSuperuser();
  const admin = await createBranchStaffUser(superToken, { role: "admin" });
  const staff = await createBranchStaffUser(superToken, { role: "staff" });
  const { item } = await makeCategoryAndItem(admin.token);

  const first = await api("POST", "/api/collections/inventory_stock/records", {
    token: staff.token,
    body: { item: item.id, branch: staff.branch.id, quantity: 5 },
  });
  assert.equal(first.status, 200);

  const duplicate = await api("POST", "/api/collections/inventory_stock/records", {
    token: staff.token,
    body: { item: item.id, branch: staff.branch.id, quantity: 99 },
  });
  assert.equal(duplicate.status, 400);
});

test("transit sheet: create with items, cascade-deletes items when the sheet is deleted", async () => {
  const superToken = await authAsSuperuser();
  const admin = await createBranchStaffUser(superToken, { role: "admin" });
  const staffA = await createBranchStaffUser(superToken, { role: "staff" });
  const staffB = await createBranchStaffUser(superToken, { role: "staff" });
  const { item } = await makeCategoryAndItem(admin.token);

  const sheet = await api("POST", "/api/collections/transit_sheets/records", {
    token: staffA.token,
    body: {
      from_branch: staffA.branch.id,
      to_branch: staffB.branch.id,
      staff: staffA.staff.id,
      status: "draft",
    },
  });
  assert.equal(sheet.status, 200, JSON.stringify(sheet.json));

  const sheetItem = await api("POST", "/api/collections/transit_sheet_items/records", {
    token: staffA.token,
    body: { transit_sheet: sheet.json.id, item: item.id, quantity: 12 },
  });
  assert.equal(sheetItem.status, 200);

  // the receiving branch's staff should be able to move it to "received"
  const receive = await api("PATCH", `/api/collections/transit_sheets/records/${sheet.json.id}`, {
    token: staffB.token,
    body: { status: "received", received_at: new Date().toISOString() },
  });
  assert.equal(receive.status, 200, JSON.stringify(receive.json));
  assert.equal(receive.json.status, "received");

  const del = await api("DELETE", `/api/collections/transit_sheets/records/${sheet.json.id}`, {
    token: admin.token,
  });
  assert.equal(del.status, 204);

  const itemsAfter = await api(
    "GET",
    `/api/collections/transit_sheet_items/records?filter=(transit_sheet='${sheet.json.id}')`,
    { token: admin.token },
  );
  assert.equal(itemsAfter.json.items.length, 0);
});

test("a staff member outside both branches cannot update a transit sheet's status", async () => {
  const superToken = await authAsSuperuser();
  const staffA = await createBranchStaffUser(superToken, { role: "staff" });
  const staffB = await createBranchStaffUser(superToken, { role: "staff" });
  const outsider = await createBranchStaffUser(superToken, { role: "staff" });

  const sheet = await api("POST", "/api/collections/transit_sheets/records", {
    token: staffA.token,
    body: {
      from_branch: staffA.branch.id,
      to_branch: staffB.branch.id,
      status: "dispatched",
    },
  });
  assert.equal(sheet.status, 200);

  const blocked = await api("PATCH", `/api/collections/transit_sheets/records/${sheet.json.id}`, {
    token: outsider.token,
    body: { status: "received" },
  });
  // Branch-scoped updateRule failures come back as 404 (PocketBase folds the
  // update-permission check into the same lookup query), not 403.
  assert.equal(blocked.status, 404);
});
