#!/usr/bin/env bash
# Reference commands for deploying lalitha-api to the Raspberry Pi.
# Not meant to be run as a single script — sudo on the Pi needs an interactive
# password (no NOPASSWD rule), so each ssh -t block below prompts separately.
# Copy/paste sections as needed, from the repo root on your Mac.
#
# Unlike EllieEats/NexaLink (a Spring Boot jar you build locally), there is
# no local build step here: PocketBase is a single static Go binary, so the
# "artifact" is the official release zip for the Pi's architecture,
# downloaded directly on the Pi (matches how Dockerfile fetches the same
# binary for local/CI Docker runs — same PB_VERSION, same source of truth,
# just a different OS/arch target than Docker's own multi-arch build).
#
# Assumes rpi-setup's configure-lalitha-api.sh has already been run (creates
# the `lalitha` system user, /opt/lalitha-api, and /var/lib/lalitha-api/
# pb_data, and the lipi.online Apache vhost) — see rpi-setup/docs/
# 14-app-deployment.md. This script re-creates the dirs/log files
# defensively too (belt and suspenders), same as ellieeats-api's
# deploy-commands.sh.
set -euo pipefail

log() { echo "[$(date '+%H:%M:%S')] $*"; }

PI_HOST="${PI_HOST:-lipi@192.168.1.13}"
PB_VERSION="0.40.4"   # must match Dockerfile's ARG PB_VERSION — bump both together
PB_ARCH="arm64"       # Raspberry Pi OS 64-bit (Debian 13/trixie) — this Pi's actual arch

# --- First-time setup on the Pi (run once) ----------------------------------

log "Creating app/data dirs and log files on the Pi..."
ssh -t "$PI_HOST" '
  sudo -u lalitha mkdir -p /opt/lalitha-api /opt/lalitha-api/scripts
  sudo -u lalitha mkdir -p /var/lib/lalitha-api/pb_data
  sudo touch /var/log/lalitha-api.log /var/log/lalitha-api-error.log
  sudo chown lalitha:lalitha /var/log/lalitha-api.log /var/log/lalitha-api-error.log
'
log "Dirs and log files ready."

log "Downloading and installing the PocketBase ${PB_VERSION} (${PB_ARCH}) binary on the Pi..."
ssh -t "$PI_HOST" "
  command -v unzip >/dev/null || sudo apt-get install -y unzip
  curl -sL https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${PB_ARCH}.zip -o /tmp/pocketbase.zip
  sudo -u lalitha unzip -o /tmp/pocketbase.zip pocketbase -d /opt/lalitha-api
  sudo -u lalitha chmod +x /opt/lalitha-api/pocketbase
  rm /tmp/pocketbase.zip
  /opt/lalitha-api/pocketbase --version
"
log "PocketBase binary installed."

log "Copying pb_migrations/, pb_hooks/, start/stop scripts, env template to the Pi (/tmp)..."
scp -r pb_migrations pb_hooks deploy/lalitha-api-start.sh deploy/lalitha-api-stop.sh deploy/lalitha-api.env "$PI_HOST:/tmp/"
log "Copy to /tmp done."

log "Installing migrations/hooks/scripts/env into place on the Pi..."
ssh -t "$PI_HOST" '
  # Replaced wholesale (rm then mv) so a migration/hook file renamed or
  # removed in this repo does not linger on the Pi — same reasoning as
  # rpi-setup'"'"'s Lahari docroot install step.
  sudo rm -rf /opt/lalitha-api/pb_migrations /opt/lalitha-api/pb_hooks
  sudo mv /tmp/pb_migrations /tmp/pb_hooks /opt/lalitha-api/
  sudo mv /tmp/lalitha-api-start.sh /tmp/lalitha-api-stop.sh /opt/lalitha-api/scripts/
  # Only move the env file if it'"'"'s not already there — don'"'"'t clobber real secrets with the blank template
  sudo bash -c "[ -f /opt/lalitha-api/lalitha-api.env ] || mv /tmp/lalitha-api.env /opt/lalitha-api/lalitha-api.env"
  sudo chown -R lalitha:lalitha /opt/lalitha-api/pb_migrations /opt/lalitha-api/pb_hooks /opt/lalitha-api/lalitha-api.env \
    /opt/lalitha-api/scripts/lalitha-api-start.sh /opt/lalitha-api/scripts/lalitha-api-stop.sh
  sudo chmod +x /opt/lalitha-api/scripts/lalitha-api-start.sh /opt/lalitha-api/scripts/lalitha-api-stop.sh
  sudo chmod 600 /opt/lalitha-api/lalitha-api.env
  # Then fill in real values: ssh in and edit /opt/lalitha-api/lalitha-api.env
  # (at minimum, set PB_SUPERUSER_PASSWORD — the template ships it blank).
'
log "Migrations/hooks/scripts/env installed."

log "Installing systemd unit..."
scp deploy/lalitha-api.service "$PI_HOST:/tmp/"
ssh -t "$PI_HOST" '
  sudo mv /tmp/lalitha-api.service /etc/systemd/system/lalitha-api.service
  sudo systemctl daemon-reload
  sudo systemctl enable --now lalitha-api
'
log "Service installed and (re)started."

# --- Future deploys (migrations/hooks only, unit/scripts/env already in place) --
log "Redeploying pb_migrations/pb_hooks only..."
scp -r pb_migrations pb_hooks "$PI_HOST:/tmp/"

ssh -t "$PI_HOST" '
  sudo rm -rf /opt/lalitha-api/pb_migrations /opt/lalitha-api/pb_hooks
  sudo mv /tmp/pb_migrations /tmp/pb_hooks /opt/lalitha-api/
  sudo chown -R lalitha:lalitha /opt/lalitha-api/pb_migrations /opt/lalitha-api/pb_hooks
  sudo systemctl restart lalitha-api
'
log "Redeploy done."

# --- Bumping the PocketBase binary version ----------------------------------
# Bump PB_VERSION in both this file and Dockerfile's ARG, then re-run the
# "Downloading and installing the PocketBase binary" block above followed by
# a `sudo systemctl restart lalitha-api`.

# --- Useful checks -----------------------------------------------------------
# Status + logs live in deploy/logs.sh — run separately, by hand:
#   bash deploy/logs.sh          # status + last 50 lines
#   bash deploy/logs.sh -f       # follow live
# Backup/restore: deploy/backup.sh, deploy/restore.sh
