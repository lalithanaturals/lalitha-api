# pb_hooks

PocketBase JS server-side hooks.

- `main.pb.js` — `onRecordCreateRequest` for `exchange_records`: assigns a sequential
  human-facing `display_id` (`EX-1`, `EX-2`, ...) via a dedicated `counters` collection
  (key: `exchange_record`), replacing scrap-calc's old Apps Script `fetchNextIds` endpoint.
  See `scrap-calc/PROJECT_PLAN.md` §3 for the rationale (a counters collection avoids the race
  conditions a `max(display_id) + 1` query would have under concurrent creates). The `counters`
  collection itself has no API rules at all (`null` on every rule) — only this hook (running with
  full `$app` access, which bypasses API rules) ever touches it; no client should read or write it
  directly.
