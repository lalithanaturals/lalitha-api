#!/usr/bin/env bash
# Redeploy pb_migrations/ + pb_hooks/ to the Pi and restart the service
# (assumes the pocketbase binary, systemd unit, scripts, and env file are
# already in place from the initial deploy-commands.sh setup — this does
# NOT re-download the PocketBase binary; bump PB_VERSION and re-run that
# part of deploy-commands.sh by hand if you need a newer PocketBase).
# Run from the repo root on your Mac: bash deploy/redeploy.sh
set -euo pipefail

log() { echo "[$(date '+%H:%M:%S')] $*"; }

PI_HOST="${PI_HOST:-lipi@192.168.1.13}"

log "Copying pb_migrations/ + pb_hooks/ to the Pi (/tmp)..."
scp -r pb_migrations pb_hooks "$PI_HOST:/tmp/"

log "Installing migrations/hooks and restarting service..."
ssh -t "$PI_HOST" '
  sudo rm -rf /opt/lalitha-api/pb_migrations /opt/lalitha-api/pb_hooks
  sudo mv /tmp/pb_migrations /tmp/pb_hooks /opt/lalitha-api/
  sudo chown -R lalitha:lalitha /opt/lalitha-api/pb_migrations /opt/lalitha-api/pb_hooks
  sudo systemctl restart lalitha-api
'
log "Redeploy done."
