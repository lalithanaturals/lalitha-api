#!/usr/bin/env bash
# Restore lalitha-api's PocketBase data from a local backup zip (made by
# deploy/backup.sh), using PocketBase's own built-in restore API. Uploads
# the zip, then triggers the restore — which makes PocketBase overwrite its
# current pb_data and restart itself (systemd's Restart=always brings it
# back up automatically; the HTTP connection for the restore request itself
# is expected to drop when that happens).
#
# DESTRUCTIVE: this replaces all current data with the backup's contents.
# Everything written since that backup was taken is lost. Confirms before
# doing anything.
#
# Usage:
#   PB_SUPERUSER_EMAIL=... PB_SUPERUSER_PASSWORD=... bash deploy/restore.sh path/to/lalitha-api-20260101T000000.zip
#
# Optional:
#   LALITHA_API_URL   (default: https://lipi.online)
set -euo pipefail

log() { echo "[$(date '+%H:%M:%S')] $*"; }
err() { echo "[$(date '+%H:%M:%S')] ERROR: $*" >&2; }

BACKUP_FILE="${1:?Usage: $0 path/to/backup.zip}"
[[ -f "$BACKUP_FILE" ]] || { err "File not found: $BACKUP_FILE"; exit 1; }

API_URL="${LALITHA_API_URL:-https://lipi.online}"
EMAIL="${PB_SUPERUSER_EMAIL:?Set PB_SUPERUSER_EMAIL}"
PASSWORD="${PB_SUPERUSER_PASSWORD:?Set PB_SUPERUSER_PASSWORD}"
NAME="$(basename "$BACKUP_FILE")"

echo "This will REPLACE ALL current data at ${API_URL} with the contents of:"
echo "  ${BACKUP_FILE}"
echo "Everything written since that backup was taken will be lost."
read -r -p "Type 'restore' to continue: " CONFIRM
[[ "$CONFIRM" == "restore" ]] || { log "Aborted."; exit 1; }

json_get() { python3 -c "import sys,json; print(json.load(sys.stdin)$1)"; }

log "Authenticating as superuser against ${API_URL}..."
AUTH_RESPONSE="$(curl -sf -X POST "${API_URL}/api/collections/_superusers/auth-with-password" \
    -H 'Content-Type: application/json' \
    -d "$(python3 -c "import json,sys; print(json.dumps({'identity': sys.argv[1], 'password': sys.argv[2]}))" "$EMAIL" "$PASSWORD")")"
TOKEN="$(echo "$AUTH_RESPONSE" | json_get "['token']")"
[[ -n "$TOKEN" ]] || { err "Auth failed: $AUTH_RESPONSE"; exit 1; }

log "Uploading ${NAME}..."
curl -sf -X POST "${API_URL}/api/backups/upload" \
    -H "Authorization: ${TOKEN}" \
    -F "file=@${BACKUP_FILE};filename=${NAME}" >/dev/null
log "Uploaded."

log "Triggering restore — PocketBase will overwrite pb_data and restart itself now."
log "(A connection error right after this is expected — that's the restart, not a failure.)"
curl -sf -X POST "${API_URL}/api/backups/${NAME}/restore" -H "Authorization: ${TOKEN}" >/dev/null || true

log "Waiting 10s for the restart, then checking ${API_URL}/api/health..."
sleep 10
if curl -sf "${API_URL}/api/health" >/dev/null; then
    log "Back up and healthy. Verify the data looks right, then check deploy/logs.sh if anything seems off."
else
    err "Not responding yet — give it a bit longer, or check deploy/logs.sh on the Pi."
fi
