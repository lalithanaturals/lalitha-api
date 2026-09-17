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
