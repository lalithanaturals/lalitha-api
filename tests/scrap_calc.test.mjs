import { test } from "node:test";
import assert from "node:assert/strict";
import { api, authAsSuperuser, createBranchStaffUser } from "./helpers.mjs";

test("creating exchange_records assigns sequential display_ids", async () => {
  const superToken = await authAsSuperuser();
  const staff = await createBranchStaffUser(superToken, { role: "staff" });

  const first = await api("POST", "/api/collections/exchange_records/records", {
    token: staff.token,
    body: {
      branch: staff.branch.id,
      staff: staff.staff.id,
      status: "estimate",
      al_weights: [12.5],
      al_handles: 1,
      st_weights: [],
      st_handles: 0,
    },
  });
  assert.equal(first.status, 200, JSON.stringify(first.json));
  assert.match(first.json.display_id, /^EX-\d+$/);

  const second = await api("POST", "/api/collections/exchange_records/records", {
    token: staff.token,
    body: { branch: staff.branch.id, status: "estimate", al_weights: [], st_weights: [] },
  });
  assert.equal(second.status, 200);

  const firstNum = Number(first.json.display_id.split("-")[1]);
  const secondNum = Number(second.json.display_id.split("-")[1]);
  assert.equal(secondNum, firstNum + 1);
});

test("estimate can be converted to an order via PATCH on the same record", async () => {
  const superToken = await authAsSuperuser();
  const staff = await createBranchStaffUser(superToken, { role: "staff" });

  const created = await api("POST", "/api/collections/exchange_records/records", {
    token: staff.token,
    body: {
      branch: staff.branch.id,
      status: "estimate",
      customer_name: "Ravi Kumar",
      al_weights: [10],
      al_handles: 0,
      st_weights: [],
      st_handles: 0,
      net_total: 100,
    },
  });
  assert.equal(created.status, 200);

  const converted = await api("PATCH", `/api/collections/exchange_records/records/${created.json.id}`, {
    token: staff.token,
    body: { status: "order" },
  });
  assert.equal(converted.status, 200);
  assert.equal(converted.json.status, "order");
  assert.equal(converted.json.display_id, created.json.display_id, "converting keeps the same display_id");
});

test("search filters by customer_name, customer_phone, or display_id", async () => {
  const superToken = await authAsSuperuser();
  const staff = await createBranchStaffUser(superToken, { role: "staff" });

  const created = await api("POST", "/api/collections/exchange_records/records", {
    token: staff.token,
    body: {
      branch: staff.branch.id,
      status: "estimate",
      customer_name: "Sita Devi",
      customer_phone: "9999900000",
      al_weights: [],
      st_weights: [],
    },
  });
  assert.equal(created.status, 200);

  const byName = await api(
    "GET",
    "/api/collections/exchange_records/records?filter=" +
      encodeURIComponent("customer_name ~ 'Sita'"),
    { token: staff.token },
  );
  assert.ok(byName.json.items.some((r) => r.id === created.json.id));

  const byPhone = await api(
    "GET",
    "/api/collections/exchange_records/records?filter=" +
      encodeURIComponent("customer_phone ~ '9999900000'"),
    { token: staff.token },
  );
  assert.ok(byPhone.json.items.some((r) => r.id === created.json.id));
});

test("staff cannot update an exchange_record belonging to a different branch", async () => {
  const superToken = await authAsSuperuser();
  const staffA = await createBranchStaffUser(superToken, { role: "staff" });
  const staffB = await createBranchStaffUser(superToken, { role: "staff" });

  const created = await api("POST", "/api/collections/exchange_records/records", {
    token: staffA.token,
    body: { branch: staffA.branch.id, status: "estimate", al_weights: [], st_weights: [] },
  });
  assert.equal(created.status, 200);

  const blocked = await api("PATCH", `/api/collections/exchange_records/records/${created.json.id}`, {
    token: staffB.token,
    body: { status: "order" },
  });
  assert.equal(blocked.status, 404);
});
