#!/usr/bin/env bash
# Run on the Linux Docker host, from the repository root.
# Include BOTH PostgreSQL and uploads, during a maintenance window with no writes.
set -euo pipefail
umask 077

if [[ ! -f compose.yaml || ! -f .env ]]; then
  echo 'Run this script from the production project root (compose.yaml and .env required).' >&2
  exit 1
fi

backup_root="${1:-./backups}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p -- "$backup_root"
target="$(cd -- "$backup_root" && pwd)/vehicle-backup-$timestamp"
temporary="$target.partial"
if [[ -e "$target" || -e "$temporary" ]]; then
  echo "Backup destination already exists: $target" >&2
  exit 1
fi
mkdir -- "$temporary"
trap 'rm -rf -- "$temporary"' EXIT

docker compose exec -T db sh -c 'exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner --no-acl' > "$temporary/database.dump"
docker compose exec -T web tar -C /app/uploads -cf - . > "$temporary/uploads.tar"
if [[ ! -s "$temporary/database.dump" || ! -s "$temporary/uploads.tar" ]]; then
  echo 'Backup files are empty; backup aborted.' >&2
  exit 1
fi

(
  cd -- "$temporary"
  sha256sum database.dump uploads.tar > SHA256SUMS
)
mv -- "$temporary" "$target"
trap - EXIT
echo "Backup complete: $target"
echo 'Copy this directory to encrypted storage outside the VPS and rehearse restoration.'
