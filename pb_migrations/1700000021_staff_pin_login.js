/// <reference path="../pb_data/types.d.ts" />
// Adds a hidden 4-digit `pin` field to `staff` and opens listRule/viewRule to
// the public so an unauthenticated device can render a "pick your name" staff
// picker before login (no PIN or other sensitive field is ever exposed by
// this, since `hidden` fields are stripped from every API response — the
// /api/staff-login route in pb_hooks/main.pb.js is the only code that reads
// the pin, and it does so server-side via $app, bypassing the REST layer
// entirely). create/update/delete stay admin-only.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("staff");

  collection.fields.add(new Field({
    "autogeneratePattern": "",
    "help": "4-digit PIN used to sign in on shared shop-floor devices. Never exposed via the API (hidden field) — only read server-side by the /api/staff-login route.",
    "hidden": true,
    "max": 4,
    "min": 4,
    "name": "pin",
    "pattern": "^[0-9]{4}$",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text",
  }));

  collection.listRule = "";
  collection.viewRule = "";

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("staff");

  collection.fields.removeByName("pin");
  collection.listRule = "@request.auth.id != \"\"";
  collection.viewRule = "@request.auth.id != \"\"";

  return app.save(collection);
})
