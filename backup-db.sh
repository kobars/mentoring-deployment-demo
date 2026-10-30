#!/usr/bin/env bash
# Backup database MySQL dari container "db" ke folder backups/.
# Dijalankan setiap hari oleh cron (lihat docs/2-deploy-backend-vps.md, langkah 9). Menyimpan 14 backup terakhir.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p backups

file="backups/db-$(date +%F-%H%M).sql.gz"
docker compose exec -T db sh -c \
  'MYSQL_PWD="$MYSQL_PASSWORD" exec mysqldump --no-tablespaces --single-transaction -u"$MYSQL_USER" "$MYSQL_DATABASE"' \
  | gzip > "$file"
echo "Backup selesai: $file"

# Hapus backup lama.
ls -1t backups/db-*.sql.gz | tail -n +15 | while read -r old; do rm -- "$old"; done
