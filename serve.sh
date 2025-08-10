#!/bin/zsh
# Simple local server to preview INEX in an iPhone frame

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

PORT="${PORT:-4321}"

echo "Starting server at http://localhost:${PORT}"
echo "Opening iPhone demo: http://localhost:${PORT}/iphone.html"

# Start python HTTP server in background
python3 -m http.server "$PORT" >/dev/null 2>&1 &
SERVER_PID=$!

# Give it a moment to boot
sleep 0.6

# Open default browser to the iPhone demo
if command -v open >/dev/null 2>&1; then
  open "http://localhost:${PORT}/iphone.html"
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "http://localhost:${PORT}/iphone.html"
fi

echo "Server PID: $SERVER_PID (Ctrl+C to stop if running in foreground)"

# Keep script attached to background server when run in foreground
wait $SERVER_PID || true


