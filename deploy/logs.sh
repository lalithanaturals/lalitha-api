#!/usr/bin/env bash
# Check lalitha-api's status and logs on the Raspberry Pi.
#
#   bash deploy/logs.sh            # service status + last 50 lines of both logs
#   bash deploy/logs.sh -f         # follow both logs live (Ctrl-C to stop)
#   bash deploy/logs.sh -n 200     # last 200 lines instead of 50
set -euo pipefail

PI_HOST="${PI_HOST:-lipi@192.168.1.13}"
LOG="/var/log/lalitha-api.log"
ERR_LOG="/var/log/lalitha-api-error.log"
LINES=50
FOLLOW=false

while getopts "fn:" opt; do
  case "$opt" in
    f) FOLLOW=true ;;
    n) LINES="$OPTARG" ;;
    *) echo "Usage: $0 [-f] [-n lines]" >&2; exit 1 ;;
  esac
done

ssh -t "$PI_HOST" "sudo systemctl status lalitha-api --no-pager"

if $FOLLOW; then
  # tail -F on both files so a log rotation doesn't kill the follow
  ssh -t "$PI_HOST" "sudo tail -F -n $LINES $LOG $ERR_LOG"
else
  ssh -t "$PI_HOST" "sudo tail -n $LINES $LOG $ERR_LOG"
fi
