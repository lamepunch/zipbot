#!/usr/bin/env bash
set -euo pipefail

DIR=${BACKUP_DIR:-/opt/zipbot/backups}
KEEP_DAYS=${KEEP_DAYS:-14}

cd "$(dirname "$0")/.."

set -a
source .env
set +a

mkdir -p "$DIR"
FILE="$DIR/zipbot-$(date -u +%Y%m%d-%H%M%S).dump"

pg_dump "${DIRECT_URL:?DIRECT_URL is not set}" \
  --format=custom \
  --no-owner \
  --file="$FILE"

find "$DIR" -name 'zipbot-*.dump' -mtime +"$KEEP_DAYS" -delete

echo "Backed up to $FILE"
