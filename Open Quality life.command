#!/bin/bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
URL="http://127.0.0.1:1420/"
LOG_FILE="$APP_DIR/.quality-life-dev.log"

cd "$APP_DIR"

if curl -fsS --max-time 1 "$URL" >/dev/null 2>&1; then
  open "$URL"
  exit 0
fi

if [ ! -d "$APP_DIR/node_modules" ]; then
  osascript -e 'display dialog "Quality life dependencies are missing. Open Terminal in this folder and run npm install once." buttons {"OK"} default button "OK"'
  exit 1
fi

(
  for _ in {1..40}; do
    if curl -fsS --max-time 1 "$URL" >/dev/null 2>&1; then
      open "$URL"
      exit 0
    fi
    sleep 0.25
  done
  open "$URL"
) &

npm run dev -- --host 127.0.0.1 2>&1 | tee "$LOG_FILE"
