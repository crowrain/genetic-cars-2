#!/usr/bin/env sh
set -eu

docker rm -f genetic-cars-2-runner genetic-cars-2-api >/dev/null 2>&1 || true
echo "Stopped BoxCar autonomous runner and state API."
