# 4. Setelah deploy

Tugas setelah aplikasi online. Semua perintah `docker compose` dijalankan di **terminal VPS**:
login dengan `ssh deploy@IP_VPS`, lalu masuk ke folder `/var/www/app` (`cd /var/www/app`).

## Deploy versi baru

**Frontend:** `git push` ke `main`. Vercel men-deploy ulang secara otomatis.

**Backend:** setelah `git push`, jalankan di **terminal VPS**:

```bash
cd /var/www/app
git pull
docker compose up -d --build
docker image prune -f
```

`docker image prune -f` menghapus image lama, agar disk tidak penuh.

**Perubahan tabel tidak otomatis.** File SQL pembuat tabel hanya dijalankan saat database
pertama kali dibuat. Untuk menambah tabel atau kolom, backup dulu (`./backup-db.sh`), tulis
perubahannya di file `.sql` baru, push, `git pull` di terminal VPS, lalu:

```bash
docker compose exec -T db sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" exec mysql -u"$MYSQL_USER" "$MYSQL_DATABASE"' < backend/db/perubahan.sql
```

**Frontend bermasalah setelah deploy?** Di Vercel: **Deployments** → pilih deploy lama yang
berhasil → **Instant Rollback**.

**Preview Deployment:** setiap branch lain dan pull request mendapat alamat `vercel.app` sendiri.
Preview memakai backend production yang sama. Hati-hati saat mencoba fitur yang mengubah data.

## Backup dan restore

`backup-db.sh` berjalan setiap hari jam 02.00 (panduan 2, langkah 9).

**Simpan salinan di luar VPS**, seminggu sekali. Backup di VPS hilang jika VPS rusak. Di **terminal laptop**, bukan terminal VPS:

```bash
scp deploy@IP_VPS:/var/www/app/backups/db-2026-10-30-0200.sql.gz .
```

**Restore.** Isi tabel diganti dengan isi backup:

```bash
gunzip -c backups/db-2026-10-30-0200.sql.gz | docker compose exec -T db sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" exec mysql -u"$MYSQL_USER" "$MYSQL_DATABASE"'
```

Coba restore sekali, agar kamu tahu backup-nya bisa dipakai.

## Monitoring

Buat akun gratis di https://uptimerobot.com. Tambahkan monitor **HTTP(s)** ke
`https://api.domainkamu.com/health`, interval 5 menit. Kamu menerima email jika backend mati.

## Perawatan bulanan

```bash
cd /var/www/app
docker compose pull
docker compose up -d
docker image prune -f
df -h /
```

- `docker compose pull` mengunduh versi terbaru MySQL dan Caddy (perbaikan keamanan).
- `df -h /` menampilkan sisa disk. Di atas 80%? Hapus file yang tidak perlu, atau upgrade VPS.
- Cek tanggal kedaluwarsa domain di Clientzone Rumah Web.

## Perintah yang sering dipakai

| Perintah | Fungsi |
| --- | --- |
| `docker compose ps` | Status container. |
| `docker compose logs -f app` | Log backend secara live. `Ctrl+C` untuk keluar. |
| `docker compose logs caddy` | Log Caddy (HTTPS). |
| `docker compose restart app` | Restart backend. |
| `docker compose exec db sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" mysql -u"$MYSQL_USER" "$MYSQL_DATABASE"'` | Membuka MySQL. `exit` untuk keluar. |
| `docker compose down` | Menghentikan container. Data tetap ada. |

**Jangan** menjalankan `docker compose down -v`. Opsi `-v` menghapus semua data MySQL dan
sertifikat HTTPS.
