#!/bin/sh
set -e

# Auto-provision a superuser on first boot if credentials are supplied via env vars.
# Safe to run on every start: `superuser upsert` is idempotent.
if [ -n "$PB_SUPERUSER_EMAIL" ] && [ -n "$PB_SUPERUSER_PASSWORD" ]; then
  pocketbase superuser upsert "$PB_SUPERUSER_EMAIL" "$PB_SUPERUSER_PASSWORD" --dir /pb/pb_data || true
fi

exec pocketbase serve --http=0.0.0.0:8090 --dir /pb/pb_data "$@"
