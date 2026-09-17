/// <reference path="../pb_data/types.d.ts" />
// Two fixes surfaced by real device testing of the Price Tag screen:
//
// 1. `products.createRule` was admin-only, but the old Print app let anyone
//    type a new brand name on the spot ("+ Add Brand Name" button, no role
//    check). The Flutter rebuild restores that as an inline "+ Add Product"
//    quick-create on PriceTagScreen, which needs any authenticated staff
//    member (not just admin) to be able to create a product record.
//
// 2. Only Gajuwaka had a seeded staff member, so every branch-scoped Staff
//    dropdown (Price Tag, Estimate, Coupon, Calculator, Register, Transit
//    Sheet) was empty for the other three branches. Seeds one placeholder
//    staff member per remaining branch, all on PIN 1234 for easy testing —
//    same disclaimer as 1700000022_seed_staff_logins.js: replace with real
//    staff via the admin UI before a production rollout.
migrate((app) => {
  const products = app.findCollectionByNameOrId("products");
  products.createRule = "@request.auth.id != \"\"";
  app.save(products);

  const staffCollection = app.findCollectionByNameOrId("staff");
  const usersCollection = app.findCollectionByNameOrId("users");

  for (const branchName of ["Kurmannapalem", "Gajuwaka Packing", "Kurmannapalem Packing"]) {
    const branch = app.findFirstRecordByFilter("branches", "name = {:name}", { name: branchName });

    const staff = new Record(staffCollection);
    staff.set("name", "Staff (" + branchName + ")");
    staff.set("pin", "1234");
    staff.set("is_active", true);
    staff.set("branch", branch.id);
    app.save(staff);

    const user = new Record(usersCollection);
    user.set("email", "staff-" + branch.id + "@lalithanaturals.local");
    user.set("password", "unused-login-password-not-checked");
    user.set("verified", true);
    user.set("role", "staff");
    user.set("staff", staff.id);
    app.save(user);
  }
}, (app) => {
  const products = app.findCollectionByNameOrId("products");
  products.createRule = "@request.auth.role = \"admin\"";
  app.save(products);

  for (const branchName of ["Kurmannapalem", "Gajuwaka Packing", "Kurmannapalem Packing"]) {
    const staff = app.findFirstRecordByFilter("staff", "name = {:name}", { name: "Staff (" + branchName + ")" });
    const user = app.findFirstRecordByFilter("users", "staff = {:staffId}", { staffId: staff.id });
    app.delete(user);
    app.delete(staff);
  }
})
