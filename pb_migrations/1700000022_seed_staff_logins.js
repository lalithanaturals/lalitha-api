/// <reference path="../pb_data/types.d.ts" />
// Seeds a minimal starting roster so the staff PIN-login flow (see
// pb_hooks/main.pb.js's /api/staff-login route) works out of the box:
// one admin and one Gajuwaka staff account. Real staff should be added
// through the admin UI (`/_/`) before a production rollout — see
// lalitha-api/README.md.
//
// Each `staff` row gets a matching `users` auth row so /api/staff-login can
// mint a token for it. The `users.password` value is never used by anyone
// (PIN login goes through the custom route, not authWithPassword) — it's
// set to a fixed placeholder purely because PocketBase requires an 8+
// character password on every auth record.
migrate((app) => {
  const gajuwaka = app.findFirstRecordByFilter("branches", "name = {:name}", { name: "Gajuwaka" });

  const staffCollection = app.findCollectionByNameOrId("staff");
  const usersCollection = app.findCollectionByNameOrId("users");

  const roster = [
    { name: "Admin", role: "admin", pin: "1234", branchId: "", email: "staff-admin@lalithanaturals.local" },
    { name: "Staff", role: "staff", pin: "1234", branchId: gajuwaka.id, email: "staff-gajuwaka@lalithanaturals.local" },
  ];

  for (const entry of roster) {
    const staff = new Record(staffCollection);
    staff.set("name", entry.name);
    staff.set("pin", entry.pin);
    staff.set("is_active", true);
    if (entry.branchId) {
      staff.set("branch", entry.branchId);
    }
    app.save(staff);

    const user = new Record(usersCollection);
    user.set("email", entry.email);
    user.set("password", "unused-login-password-not-checked");
    user.set("verified", true);
    user.set("role", entry.role);
    user.set("staff", staff.id);
    app.save(user);
  }
}, (app) => {
  for (const email of ["staff-admin@lalithanaturals.local", "staff-gajuwaka@lalithanaturals.local"]) {
    const user = app.findFirstRecordByFilter("users", "email = {:email}", { email });
    const staffId = user.get("staff");
    app.delete(user);
    if (staffId) {
      app.delete(app.findRecordById("staff", staffId));
    }
  }
})
