/// <reference path="../pb_data/types.d.ts" />
// price_tags, coupons, custom_prints, transit_sheets, and exchange_records were created without
// `created`/`updated` autodate fields, but their Flutter repositories all sort list queries by
// `-created` (PriceTagRepository, CouponRepository, CustomPrintRepository,
// TransitSheetRepository, ExchangeRecordRepository) — every one of those list calls was
// returning 400 "Something went wrong while processing your request." against a real backend.
// This went unnoticed because the Dart-side tests mock the HTTP client (so an invalid sort field
// is never actually validated) and TransitHistoryScreen was the first screen to actually call
// listForBranch end-to-end. Adds the missing fields so sorting by `-created` works, matching the
// `users` auth collection which already has them.
const affectedCollections = ["price_tags", "coupons", "custom_prints", "transit_sheets", "exchange_records"];

migrate((app) => {
  for (const name of affectedCollections) {
    const collection = app.findCollectionByNameOrId(name);
    collection.fields.add(
      new Field({ type: "autodate", name: "created", onCreate: true, onUpdate: false }),
      new Field({ type: "autodate", name: "updated", onCreate: true, onUpdate: true }),
    );
    app.save(collection);
  }
}, (app) => {
  for (const name of affectedCollections) {
    const collection = app.findCollectionByNameOrId(name);
    collection.fields.removeByName("created");
    collection.fields.removeByName("updated");
    app.save(collection);
  }
})
