# lalitha-api

PocketBase backend for the Lalitha Naturals app suite (Print, Stock-transfer, scrap-calc,
Denomination). See [PROJECT_PLAN.md](../Print/PROJECT_PLAN.md) in the `Print` repo for the full
suite-wide architecture and data-store rationale, and each module repo's own `PROJECT_PLAN.md`
for its collections.

Currently modeled — **every collection every module needs is now in place**: the shared
collections (`branches`, `staff`, `users`, `settings`), the **Print module's** collections
(`products`, `price_tags`, `estimates`, `estimate_items`, `coupons`, `custom_prints`), the
**Stock-transfer module's** collections (`inventory_categories`, `inventory_items`,
`inventory_stock`, `transit_sheets`, `transit_sheet_items`), the **scrap-calc module's**
collections (`exchange_records` and the server-only `counters` collection behind its sequential
`display_id`), and the **Denomination module's** collections (`audit_registers`,
`audit_line_items`), per the master plan.

## Layout

```
pb_migrations/   PocketBase JS migrations that define every collection & access rule
pb_hooks/        server-side JS hooks (exchange_records' sequential display_id, staff PIN login)
scripts/test.sh  builds + runs an ephemeral Docker container and runs the test suite against it
tests/           Node.js API test suite (node:test) exercising the REST API end-to-end
Dockerfile       downloads the pinned PocketBase binary and bakes in the migrations (local/CI Docker only — see "Deploying to the Raspberry Pi")
docker-compose.yml       persistent dev instance (named volume, port 8090)
docker-compose.test.yml  ephemeral test instance (tmpfs, port 8091)
deploy/          Raspberry Pi deployment: systemd unit, start/stop scripts, deploy/backup/restore/logs — see below
```

## Running locally (no Docker)

Requires the [PocketBase binary](https://pocketbase.io/docs/) for your platform.

```bash
./pocketbase migrate up --dir pb_data
./pocketbase superuser upsert admin@lalithanaturals.local <password> --dir pb_data
./pocketbase serve --dir pb_data
```

## Running via Docker

```bash
docker compose up -d --build
# Admin UI: http://localhost:8090/_/
# REST API: http://localhost:8090/api/
```

Superuser credentials come from `PB_SUPERUSER_EMAIL` / `PB_SUPERUSER_PASSWORD` env vars (see
`docker-compose.yml`); change them for anything beyond local dev.

## Deploying to the Raspberry Pi

**Docker is only used for local dev/CI testing above — the Pi deployment does not use
Docker.** Every other app on the family Pi (EllieEats, NexaLink, Lahari) runs natively under
systemd, not in a container (Docker itself was deliberately removed from that Pi — see
`rpi-setup/docs/14-app-deployment.md`), so `lalitha-api` follows the same pattern: the
`pocketbase` binary + `pb_migrations/` + `pb_hooks/` deployed straight onto the Pi, run by
`lalitha-api.service`.

Reachable at **https://lipi.online**, proxied by Apache (TLS termination) to PocketBase
listening on loopback `127.0.0.1:8084`. The account/directories/vhost side of this is owned
by the sibling `rpi-setup` repo (`scripts/configure-lalitha-api.sh`); this repo's `deploy/`
directory owns the actual binary/migrations/hooks/systemd-unit/secrets:

| Script | Purpose |
|---|---|
| `deploy/deploy-commands.sh` | Reference commands for first-time setup (copy/paste section by section — not a single runnable script, since the Pi's `sudo` needs an interactive password) |
| `deploy/redeploy.sh` | Routine update: ships `pb_migrations/` + `pb_hooks/`, restarts the service. Run this after every migration/hook change. |
| `deploy/logs.sh` | Service status + tail (`-f` to follow, `-n` for line count) |
| `deploy/backup.sh` | Downloads a PocketBase-native backup (SQLite + file storage) to `deploy/backups/` on this machine, via PocketBase's own `/api/backups` API — not a hand-rolled `sqlite3`/`tar` script |
| `deploy/restore.sh` | Uploads a local backup zip and restores it (destructive — prompts for confirmation) |
| `deploy/lalitha-api.service` | The systemd unit (`User=lalitha`, hardened with `ProtectSystem=strict` + `ReadWritePaths=/var/lib/lalitha-api/pb_data`) |
| `deploy/lalitha-api-start.sh` / `-stop.sh` | `ExecStart`/`ExecStop` — sources `lalitha-api.env`, runs the superuser upsert (same idempotent behavior as `docker-entrypoint.sh`), execs `pocketbase serve` |
| `deploy/lalitha-api.env` | Local-only, gitignored — real superuser email/password + port/data-dir overrides. Never committed, not even as a template (matches `ellieeats-api`'s convention) — `deploy-commands.sh`'s comments document the required vars |

First-time setup (once `rpi-setup`'s `configure-lalitha-api.sh` + DNS + a cert are in place):
work through `deploy/deploy-commands.sh` section by section. After that, routine updates are
just:

```bash
bash deploy/redeploy.sh
```

### First-time setup gotchas

`configure-lalitha-api.sh` and `deploy-commands.sh` are two separate steps run at different
times (the former sets up the account/dirs/vhost, the latter ships the actual app) — running
only the first leaves Apache proxying to a port nothing is listening on, which surfaces as a
generic Apache 503 on `https://lipi.online` with no indication the app itself was ever at
fault. If that happens, check `sudo systemctl status lalitha-api` on the Pi before assuming the
service crashed — it may never have been installed yet.

`deploy-commands.sh`'s install step deliberately never overwrites an existing
`/opt/lalitha-api/lalitha-api.env` (see its `[ -f ... ] || mv ...` guard, so re-running
first-time setup can't clobber real secrets with the blank template). That means if
`lalitha-api.env` was hand-created on the Pi (e.g. by `configure-lalitha-api.sh`) with only
`PB_SUPERUSER_PASSWORD` set and no `PB_SUPERUSER_EMAIL`, the start script's
`[[ -n "$PB_SUPERUSER_EMAIL" && -n "$PB_SUPERUSER_PASSWORD" ]]` guard silently skips the
superuser upsert on every restart — no error, just no superuser account ever created. **Both
vars must be set together** for the upsert to run at all.

PocketBase also enforces an 8-character minimum on the superuser password. A too-short
password makes the upsert fail (not silently — it errors, but only into
`/var/log/lalitha-api-error.log`, not `journalctl`, since `lalitha-api.service` redirects
stdout/stderr to those files):

```
2026/09/20 13:49:29 failed to upsert superuser account: password: Must be at least 8 character(s).
```

After changing `lalitha-api.env` and restarting, always confirm the upsert actually succeeded —
`Invalid login credentials` at `/_/` gives no hint of *why* the account doesn't exist:

```bash
sudo tail -20 /var/log/lalitha-api-error.log   # look for "failed to upsert superuser"
```

If it did fail, create/fix the superuser directly rather than relying on the next restart:

```bash
sudo -u lalitha /opt/lalitha-api/pocketbase superuser upsert admin@lalithanaturals.local <password-8chars+> --dir /var/lib/lalitha-api/pb_data
```

Also note: `/opt/lalitha-api` and its contents are owned by `lalitha:lalitha` with `750`/`700`
perms, so an SSH session as the Pi's regular deploy user (not `lalitha`) can't `ls`/`cat` into
it directly — prefix reads/writes with `sudo` (or `sudo -u lalitha` to run the binary), same as
`deploy-commands.sh` already does for the install steps.

Data lives at `/var/lib/lalitha-api/pb_data` on the Pi — separate from `/opt/lalitha-api`
(the code), so `redeploy.sh` replacing `pb_migrations/`/`pb_hooks/` wholesale never touches
it. Back it up regularly:

```bash
PB_SUPERUSER_EMAIL=admin@lalithanaturals.local PB_SUPERUSER_PASSWORD=... bash deploy/backup.sh
```

## Testing

```bash
npm test              # against a PocketBase instance already running on :8091 (or set PB_URL)
npm run test:docker   # builds + starts an ephemeral Docker container, runs tests, tears it down
```

`scripts/test.sh` is the Docker-based path: it brings up `docker-compose.test.yml` (a throwaway
instance with a `tmpfs` data dir so each run starts from a clean database), waits for it to report
healthy, runs the Node test suite (`tests/*.test.mjs`) against it, and tears the container down
whether the tests pass or fail.

`npm run test:docker` has been run successfully end-to-end: image build, container start,
healthcheck, all tests against the containerized instance, and teardown all passed. (One
environment note: the sandbox this was developed in couldn't do a plain `docker pull` of a new
image from Docker Hub — its Docker daemon routes through a restricted proxy that only serves
already-cached images — so `alpine:3.20` had to be aliased locally to an already-cached
Alpine-based image to get `docker build`'s `FROM` resolution to succeed offline. That workaround
was local-only and is not reflected anywhere in this repo; a normal environment with Docker Hub
access pulls the real `alpine:3.20` and needs no such alias.)

### What's covered

- Health check
- Auth: superuser login, staff-user login via a created `users` record
- Access rules: `branches`/`staff`/`products` writable by `admin` role only, readable by any
  authenticated user, invisible to anonymous requests
- `price_tags`: staff can create/update within their own branch; cross-branch updates are denied;
  admin can update any branch
- `estimates` + `estimate_items`: creation, total calculation, and cascade-delete of items when
  the parent estimate is deleted
- `coupons`: issue → redeem lifecycle
- `custom_prints`: arbitrary JSON `content` storage, `print_type` enum validation
- `settings`: unique `key` constraint, admin-only writes with staff read access
- `inventory_categories`/`inventory_items`: admin-only writes, staff read access
- `inventory_stock`: staff can create/update counts for their own branch; unique `(item, branch)`
  pair enforced
- `transit_sheets` + `transit_sheet_items`: creation with line items, status transitions allowed
  for staff at either the sending or receiving branch (denied — as a 404, matching the
  branch-scoped `price_tags` behavior above — for staff outside both), cascade-delete of items
  when the sheet is deleted
- `exchange_records`: the `pb_hooks/main.pb.js` hook assigns sequential `display_id`s (`EX-1`,
  `EX-2`, ...) on create; estimate → order conversion via a status `PATCH` on the same record
  (keeping its `display_id`); search by `customer_name`/`customer_phone`/`display_id` filters;
  branch-scoped updates denied for staff outside the record's branch
- `audit_registers`: draft → committed lifecycle (`committed_by` stamped on commit); unique
  `(branch, date)` pair enforced (one register per branch per day); the opening-balance-chaining
  query (yesterday's closing balance for the branch) via `filter`; branch-scoped updates denied
  for staff outside the register's branch
- `audit_line_items`: creation and cascade-delete of line items when the parent register is
  deleted

## Migrations

`pb_migrations/*.js` were generated by PocketBase itself (`pocketbase migrate collections`) after
creating each collection through the Admin API, then hand-ordered so dependent collections
(`staff` needs `branches`, `price_tags` needs `products`, etc.) always migrate after what they
reference. Verified end-to-end against a real PocketBase binary from a clean `pb_data` directory —
see the git history for `pb_migrations/` if you need to regenerate or extend them.

To add a new collection: either create it through the Admin UI (`/_/`) locally and run
`./pocketbase migrate collections` to snapshot it into a new `pb_migrations/<timestamp>_*.js`
file, or hand-write a migration following the existing files' shape.

### Staff PIN login

Every collection except `staff` requires an authenticated user (`@request.auth.id != ""`), so the
Flutter app needs to log in before it can show anything. Since these are shared shop-floor
devices, login is a 4-digit PIN rather than an email/password form: `staff.listRule`/`viewRule`
are public so the app can render a "pick your name" screen, `staff.pin` is a `hidden` field (never
serialized in any API response, including that public list), and `POST /api/staff-login`
(`pb_hooks/main.pb.js`) is the only code that ever reads a PIN — it looks up the staff record,
checks the PIN server-side via `$app`, finds the linked `users` record (`users.staff` relation),
and returns a normal PocketBase auth token via `$apis.recordAuthResponse`, so the client treats it
exactly like `authWithPassword`'s response.

`1700000022_seed_staff_logins.js` and `1700000024_relax_products_create_and_seed_staff.js`
together seed one starting account per branch, all on PIN **1234** for easy testing — change them
before a production rollout:

| Name  | Role  | PIN  | Branch    |
|-------|-------|------|-----------|
| Admin | admin | 1234 | (none — admin bypasses branch scoping) |
| Staff | staff | 1234 | Gajuwaka  |
| Staff (Kurmannapalem) | staff | 1234 | Kurmannapalem |
| Staff (Gajuwaka Packing) | staff | 1234 | Gajuwaka Packing |
| Staff (Kurmannapalem Packing) | staff | 1234 | Kurmannapalem Packing |

### `created`/`updated` fields

Only collections created through the Admin UI get `created`/`updated` autodate fields
automatically — hand-written/JS-migration collections don't, unless the migration explicitly adds
them. `price_tags`, `coupons`, `custom_prints`, `transit_sheets`, and `exchange_records` were
missing them even though their Flutter repositories all sort list queries by `-created`, so every
one of those list calls 400'd against a real backend (`1700000023_add_created_updated_fields.js`
fixes it). This went unnoticed for a while because the Flutter-side repository tests mock the
HTTP client — they never validate that a `sort` param is actually a real field — and because
several of the affected list calls (`TransitSheetRepository.listForBranch` in particular) had no
UI caller until the Transit History screen. `tests/sortable_collections.test.mjs` now guards
against this recurring: **any new base collection whose repository sorts by `-created` needs
those two fields added in its own migration** (see the `users` auth collection or
`1700000023_add_created_updated_fields.js` for the field shape).

Add real staff through the admin UI (`/_/` → `staff` + `users` collections) before a production
rollout, and change/remove these two placeholder PINs.

### Seed data

`1700000020_seed_reference_data.js` is a *data* migration (not a schema one): it inserts the
real branch list and the full Stock-transfer inventory catalog (7 categories, 141 items) that
the original static HTML app carried as a hardcoded `defaultInventoryData` object / Google Sheets
fallback, so a fresh install looks like the real business instead of an empty database. Six
duplicate item codes present in that original hardcoded catalog were dropped, since `code` is a
unique index on `inventory_items` — see the migration file's header comment for which ones.
`products`, `settings`, and the other catalogs are intentionally left empty: the old app entered
those by hand through its UI rather than hardcoding them, so there's nothing authoritative to
seed. `products.createRule` is any authenticated user (not admin-only, unlike most other
collections) for the same reason — the old app's Price Tag screen had a plain "+ Add Brand Name"
button with no role check, and the Flutter rebuild's inline product quick-create needs to match
that (see `1700000024_relax_products_create_and_seed_staff.js`).
