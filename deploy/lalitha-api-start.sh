#!/usr/bin/env bash
# Invoked by systemd as ExecStart (see lalitha-api.service) — not meant to be run
# interactively, though it works fine that way for testing.
set -euo pipefail

APP_DIR="/opt/lalitha-api"
BIN="$APP_DIR/pocketbase"

# Secrets/config that shouldn't live in the unit file or the repo (superuser
# email/password, HTTP bind address/port, data dir overrides). Optional —
# skipped if absent.
if [[ -f "$APP_DIR/lalitha-api.env" ]]; then
    set -a
    source "$APP_DIR/lalitha-api.env"
    set +a
fi

# Loopback only — Apache (configure-lalitha-api.sh's vhost) is the public
# TLS terminator/reverse proxy; PocketBase itself is never reachable
# directly from the network. Matches docker-compose.yml's local-dev port
# (8090) being a different, unrelated number by design — this is the Pi's
# own port-registry slot (rpi-setup/docs/14-app-deployment.md: 8000
# rpi-monitor, 8081 ellieeats-api, 8082 nexalink-api, 8083 lahari-counter,
# 8084 lalitha-api).
PB_HTTP_ADDR="${PB_HTTP_ADDR:-127.0.0.1:8084}"
# Separate from $APP_DIR (the code) so a redeploy of the binary/migrations/
# hooks never touches the data — see configure-lalitha-api.sh in rpi-setup.
PB_DATA_DIR="${PB_DATA_DIR:-/var/lib/lalitha-api/pb_data}"

# Same idempotent upsert docker-entrypoint.sh does for local/CI Docker runs
# — safe to run on every start. Only actually does anything the first time
# (or if the password is deliberately changed in lalitha-api.env later).
if [[ -n "${PB_SUPERUSER_EMAIL:-}" && -n "${PB_SUPERUSER_PASSWORD:-}" ]]; then
    "$BIN" superuser upsert "$PB_SUPERUSER_EMAIL" "$PB_SUPERUSER_PASSWORD" --dir "$PB_DATA_DIR" || true
fi

cd "$APP_DIR"
exec "$BIN" serve --http="$PB_HTTP_ADDR" --dir "$PB_DATA_DIR"
