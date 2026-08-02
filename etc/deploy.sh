#!/usr/bin/env bash
set -euo pipefail

# Runs as the zipbot user, which has no sudo: restart the service separately
# with `sudo systemctl restart zipbot`.

BUN=${BUN:-/home/zipbot/.bun/bin/bun}

cd "$(dirname "$0")/.."

git pull
git -C extensions pull

$BUN install
$BUN run prisma:generate
$BUN run prisma:migrate

echo "Deployed $(git rev-parse --short HEAD)"
