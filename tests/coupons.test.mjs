import { test } from "node:test";
import assert from "node:assert/strict";
import { api, authAsSuperuser, createBranchStaffUser } from "./helpers.mjs";

test("coupon lifecycle: issue then redeem", async () => {
  const superToken = await authAsSuperuser();
  const staff = await createBranchStaffUser(superToken, { role: "staff" });

  const issue = await api("POST", "/api/collections/coupons/records", {
    token: staff.token,
    body: {
      coupon_type: "festival_discount",
      branch: staff.branch.id,
      staff: staff.staff.id,
      discount_value: 15,
      redeemed: false,
    },
  });
  assert.equal(issue.status, 200, JSON.stringify(issue.json));
  assert.equal(issue.json.redeemed, false);

  const redeem = await api("PATCH", `/api/collections/coupons/records/${issue.json.id}`, {
    token: staff.token,
    body: { redeemed: true, redeemed_at: new Date().toISOString() },
  });
  assert.equal(redeem.status, 200);
  assert.equal(redeem.json.redeemed, true);
  assert.ok(redeem.json.redeemed_at);
});
