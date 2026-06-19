#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
IMAGE="${BOXCAR_PLAYWRIGHT_IMAGE:-mcr.microsoft.com/playwright/mcp:latest}"
HOST_IP="${BOXCAR_HOST_IP:-192.168.1.87}"
WEB_PORT="${BOXCAR_WEB_PORT:-8087}"
API_PORT="${BOXCAR_API_PORT:-8089}"
WEB_URL="${BOXCAR_WEB_URL:-http://${HOST_IP}:${WEB_PORT}}"
API_URL="${BOXCAR_API_URL:-http://${HOST_IP}:${API_PORT}}"
UID_GID="$(id -u):$(id -g)"

docker rm -f genetic-cars-2-api genetic-cars-2-runner >/dev/null 2>&1 || true

docker run -d \
  --name genetic-cars-2-api \
  --restart unless-stopped \
  --user "$UID_GID" \
  -e HOME=/tmp \
  -e NODE_PATH=/app/node_modules \
  -e BOXCAR_API_PORT="$API_PORT" \
  -e BOXCAR_DATA_DIR=/work/data \
  -v "$ROOT":/work \
  -w /work \
  -p "${HOST_IP}:${API_PORT}:${API_PORT}" \
  --entrypoint node \
  "$IMAGE" \
  api-server.js

docker run -d \
  --name genetic-cars-2-runner \
  --restart unless-stopped \
  --user "$UID_GID" \
  -e HOME=/tmp \
  -e NODE_PATH=/app/node_modules \
  -e BOXCAR_URL="${WEB_URL}/?runner=1&api=${API_URL}" \
  -v "$ROOT":/work \
  -w /work \
  --network host \
  --entrypoint node \
  "$IMAGE" \
  runner.js

echo "API: ${API_URL}/health"
echo "Viewer: ${WEB_URL}/"
echo "Runner container: genetic-cars-2-runner"
