#!/usr/bin/env bash
# Back up lalitha-api's PocketBase data (SQLite + file storage) to this
# machine, using PocketBase's own built-in backup API — not a hand-rolled
# sqlite3/tar approach — so it's consistent even while the service is live
# (PocketBase snapshots pb_data internally; see
# https://pocketbase.io/docs/going-to-production/#backups). Works against
# either the live domain or a local dev instance.
#
# Run from the repo root (or anywhere — paths below are relative to this
# script): bash deploy/backup.sh
#
# Required env vars (no defaults — these are secrets):
#   PB_SUPERUSER_EMAIL, PB_SUPERUSER_PASSWORD
# Optional:
#   LALITHA_API_URL   (default: https://lipi.online)
#   BACKUP_DIR        (default: deploy/backups, next to this script — gitignored)
#   KEEP_DAYS         (default: 14 — older local backups are pruned after a successful run)
#
# Example:
#   PB_SUPERUSER_EMAIL=admin@lalithanaturals.local PB_SUPERUSER_PASSWORD=... bash deploy/backup.sh
#   LALITHA_API_URL=http://127.0.0.1:8090 PB_SUPERUSER_EMAIL=... PB_SUPERUSER_PASSWORD=... bash deploy/backup.sh   # local dev instance
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
log() { echo "[$(date '+%H:%M:%S')] $*"; }
err() { echo "[$(date '+%H:%M:%S')] ERROR: $*" >&2; }

API_URL="${LALITHA_API_URL:-https://lipi.online}"
EMAIL="${PB_SUPERUSER_EMAIL:?Set PB_SUPERUSER_EMAIL (must match the value in lalitha-api.env on the Pi)}"
PASSWORD="${PB_SUPERUSER_PASSWORD:?Set PB_SUPERUSER_PASSWORD (must match the value in lalitha-api.env on the Pi)}"
BACKUP_DIR="${BACKUP_DIR:-${SCRIPT_DIR}/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"

mkdir -p "$BACKUP_DIR"

json_get() { python3 -c "import sys,json; print(json.load(sys.stdin)$1)"; }

log "Authenticating as superuser against ${API_URL}..."
AUTH_RESPONSE="$(curl -sf -X POST "${API_URL}/api/collections/_superusers/auth-with-password" \
    -H 'Content-Type: application/json' \
    -d "$(python3 -c "import json,sys; print(json.dumps({'identity': sys.argv[1], 'password': sys.argv[2]}))" "$EMAIL" "$PASSWORD")")"
TOKEN="$(echo "$AUTH_RESPONSE" | json_get "['token']")"
[[ -n "$TOKEN" ]] || { err "Auth failed: $AUTH_RESPONSE"; exit 1; }

NAME="lalitha-api-$(date +%Y%m%dT%H%M%S).zip"
log "Requesting backup '${NAME}'..."
curl -sf -X POST "${API_URL}/api/backups" \
    -H "Authorization: ${TOKEN}" -H 'Content-Type: application/json' \
    -d "$(python3 -c "import json,sys; print(json.dumps({'name': sys.argv[1]}))" "$NAME")" >/dev/null

log "Waiting for '${NAME}' to appear in the backup list (creation runs in the background)..."
FOUND=0
for _ in $(seq 1 60); do
    if curl -sf "${API_URL}/api/backups" -H "Authorization: ${TOKEN}" \
        | python3 -c "import sys,json; sys.exit(0 if any(b['key']=='$NAME' for b in json.load(sys.stdin)) else 1)"; then
        FOUND=1
        break
    fi
    sleep 5
done
[[ "$FOUND" -eq 1 ]] || { err "Timed out waiting for the backup to be created. Check deploy/logs.sh on the Pi."; exit 1; }

log "Requesting a file-access token to download it..."
FILE_TOKEN="$(curl -sf -X POST "${API_URL}/api/files/token" -H "Authorization: ${TOKEN}" | json_get "['token']")"
[[ -n "$FILE_TOKEN" ]] || { err "Failed to get a file token."; exit 1; }

log "Downloading to ${BACKUP_DIR}/${NAME}..."
curl -sf "${API_URL}/api/backups/${NAME}?token=${FILE_TOKEN}" -o "${BACKUP_DIR}/${NAME}"
log "Downloaded: ${BACKUP_DIR}/${NAME} ($(du -h "${BACKUP_DIR}/${NAME}" | cut -f1))"

log "Deleting the on-server copy (this Mac's ${BACKUP_DIR}/ is now the durable copy — the Pi's SD card isn't)..."
curl -sf -X DELETE "${API_URL}/api/backups/${NAME}" -H "Authorization: ${TOKEN}" >/dev/null

log "Pruning local backups older than ${KEEP_DAYS} days..."
find "$BACKUP_DIR" -name 'lalitha-api-*.zip' -mtime "+${KEEP_DAYS}" -print -delete

log "Done."
