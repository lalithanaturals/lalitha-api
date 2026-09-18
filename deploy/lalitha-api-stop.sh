#!/usr/bin/env bash
# Invoked by systemd as ExecStop (see lalitha-api.service).
set -euo pipefail

pkill -f '/opt/lalitha-api/pocketbase serve' || true
