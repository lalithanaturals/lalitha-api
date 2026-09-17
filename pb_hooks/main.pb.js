/// <reference path="../pb_data/types.d.ts" />

// Assigns a human-facing sequential display_id to new exchange_records,
// replacing scrap-calc's old Apps Script "fetchNextIds" endpoint. Uses a
// dedicated `counters` collection (key: "exchange_record") rather than
// max(display_id)+1 so it stays correct even if records are ever deleted.
// See scrap-calc/PROJECT_PLAN.md §3.
onRecordCreateRequest((e) => {
  let counter;
  try {
    counter = $app.findFirstRecordByFilter("counters", "key = 'exchange_record'");
  } catch (err) {
    counter = null;
  }

  let nextValue;
  if (counter) {
    nextValue = (counter.get("value") || 0) + 1;
    counter.set("value", nextValue);
  } else {
    const countersCollection = $app.findCollectionByNameOrId("counters");
    counter = new Record(countersCollection);
    counter.set("key", "exchange_record");
    nextValue = 1;
    counter.set("value", nextValue);
  }
  $app.save(counter);

  e.record.set("display_id", "EX-" + nextValue);
  e.next();
}, "exchange_records");

// 4-digit PIN login for the shared shop-floor device: the client first lists
// `staff` (public read, see pb_migrations/1700000021_staff_pin_login.js) to
// show a "pick your name" screen, then posts {staff_id, pin} here. The pin
// comparison and the users lookup both run server-side via $app, so the
// hidden `staff.pin` field is never exposed through the regular REST API —
// this route is the only code that ever reads it. Reuses PocketBase's own
// $apis.recordAuthResponse so the response shape (and the resulting client
// auth token) is identical to a normal authWithPassword() call.
routerAdd("POST", "/api/staff-login", (e) => {
  const body = new DynamicModel({ staff_id: "", pin: "" });
  e.bindBody(body);

  if (!body.staff_id || !body.pin) {
    throw new BadRequestError("staff_id and pin are required.");
  }

  let staff;
  try {
    staff = $app.findFirstRecordByFilter(
      "staff",
      "id = {:id} && pin = {:pin} && is_active = true",
      { id: body.staff_id, pin: body.pin },
    );
  } catch (err) {
    throw new BadRequestError("Incorrect PIN.");
  }

  let user;
  try {
    user = $app.findFirstRecordByFilter("users", "staff = {:staffId}", { staffId: staff.id });
  } catch (err) {
    throw new BadRequestError("No login account for this staff member.");
  }

  $apis.recordAuthResponse(e, user, "");
});
