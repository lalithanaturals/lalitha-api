import { test } from "node:test";
import assert from "node:assert/strict";
import { api, authAsSuperuser } from "./helpers.mjs";

// price_tags, coupons, custom_prints, transit_sheets, and exchange_records were created without
// `created`/`updated` autodate fields (1700000023_add_created_updated_fields.js added them), but
// their Flutter repositories all sort list queries by `-created`. Regression-guards that each
// collection actually has a `created` field to sort by, since the Dart-side tests mock the HTTP
// client and never catch an invalid `sort` param against a real PocketBase instance.
const collections = ["price_tags", "coupons", "custom_prints", "transit_sheets", "exchange_records"];

test("collections sorted by -created in a Flutter repository actually have a created field", async () => {
  const token = await authAsSuperuser();
  for (const name of collections) {
    const res = await api("GET", `/api/collections/${name}/records?sort=-created&perPage=1`, { token });
    assert.equal(res.status, 200, `${name}: ${JSON.stringify(res.json)}`);
  }
});
