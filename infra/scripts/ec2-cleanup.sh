#!/usr/bin/env sh
set -eu

# Safe defaults:
# - prune old images + build cache + stopped containers
# - never prune volumes unless explicitly requested

: "${IMAGE_RETENTION_HOURS:=168}"
: "${PRUNE_VOLUMES:=false}"

echo "[cleanup] image retention: ${IMAGE_RETENTION_HOURS}h"

echo "[cleanup] pruning unused images..."
docker image prune -af --filter "until=${IMAGE_RETENTION_HOURS}h"

echo "[cleanup] pruning build cache..."
docker builder prune -af --filter "until=${IMAGE_RETENTION_HOURS}h"

echo "[cleanup] pruning stopped containers..."
docker container prune -f --filter "until=${IMAGE_RETENTION_HOURS}h"

if [ "${PRUNE_VOLUMES}" = "true" ]; then
  echo "[cleanup] pruning dangling volumes..."
  docker volume prune -f
else
  echo "[cleanup] skipping volume prune (set PRUNE_VOLUMES=true to enable)"
fi

echo "[cleanup] done"
