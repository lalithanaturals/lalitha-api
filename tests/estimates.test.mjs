import { test } from "node:test";
import assert from "node:assert/strict";
import { api, authAsSuperuser, createBranchStaffUser } from "./helpers.mjs";

test("estimate + estimate_items: create, total, and cascade delete", async () => {
  const superToken = await authAsSuperuser();
  const staff = await createBranchStaffUser(superToken, { role: "staff" });

  const estimate = await api("POST", "/api/collections/estimates/records", {
    token: staff.token,
    body: {
      branch: staff.branch.id,
      staff: staff.staff.id,
      customer_name: "Walk-in Customer",
      customer_phone: "9999999999",
      total_amount: 0,
    },
  });
  assert.equal(estimate.status, 200, JSON.stringify(estimate.json));

  const item1 = await api("POST", "/api/collections/estimate_items/records", {
    token: staff.token,
    body: { estimate: estimate.json.id, item_name: "Item A", quantity: 2, unit_price: 50, line_total: 100 },
  });
  const item2 = await api("POST", "/api/collections/estimate_items/records", {
    token: staff.token,
    body: { estimate: estimate.json.id, item_name: "Item B", quantity: 1, unit_price: 75, line_total: 75 },
  });
  assert.equal(item1.status, 200);
  assert.equal(item2.status, 200);

  const list = await api(
    "GET",
    `/api/collections/estimate_items/records?filter=(estimate='${estimate.json.id}')`,
    { token: staff.token },
  );
  assert.equal(list.json.items.length, 2);
  const total = list.json.items.reduce((sum, i) => sum + i.line_total, 0);
  assert.equal(total, 175);

  // deleting the parent estimate should cascade-delete its items
  const del = await api("DELETE", `/api/collections/estimates/records/${estimate.json.id}`, { token: staff.token });
  assert.equal(del.status, 204);

  const listAfter = await api(
    "GET",
    `/api/collections/estimate_items/records?filter=(estimate='${estimate.json.id}')`,
    { token: staff.token },
  );
  assert.equal(listAfter.json.items.length, 0);
});
