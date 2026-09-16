#!/usr/bin/env bash
# Builds and starts an ephemeral PocketBase container (docker-compose.test.yml),
# waits for it to be healthy, runs the Node API test suite against it, then
# tears the container down regardless of test outcome.
set -euo pipefail
cd "$(dirname "$0")/.."

COMPOSE="docker compose -f docker-compose.test.yml"

cleanup() {
  echo "--- tearing down test container ---"
  $COMPOSE down -v --remove-orphans >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "--- building & starting ephemeral PocketBase test container ---"
$COMPOSE up -d --build --wait

export PB_URL="http://127.0.0.1:8091"
export PB_SUPERUSER_EMAIL="admin@lalithanaturals.local"
export PB_SUPERUSER_PASSWORD="TestAdmin123!"

echo "--- running test suite against $PB_URL ---"
node --test tests/*.test.mjs
