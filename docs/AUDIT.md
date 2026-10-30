# Audit: dari project kelas ke siap deploy

Dokumen ini menjelaskan masalah yang ditemukan di project Day 48, kenapa masalah itu penting
saat aplikasi di-deploy, dan apa perbaikannya. Cocok dibahas bersama siswa.

## 1. Frontend di Vercel tidak bisa memanggil backend

**Masalah.** Frontend memanggil `/api/...` dengan alamat relatif. Jika frontend ada di Vercel
dan backend ada di VPS, alamat itu mengarah ke Vercel, bukan ke VPS.

**Perbaikan.** `frontend/vercel.json` berisi aturan rewrite: Vercel meneruskan `/api/...` ke
VPS. Kode frontend tidak berubah, dan backend tidak perlu pengaturan CORS.

## 2. Server hanya bisa diakses dari laptop

**Masalah.** Server di-listen di `127.0.0.1` tanpa web server di depannya. Dari internet,
port itu tidak bisa diakses.

**Perbaikan.** Di VPS, container **Caddy** menerima request dari internet (port 80 dan 443) dan
meneruskannya ke container backend. Port backend dan MySQL tidak dibuka ke internet.
Lihat `docker-compose.yml` dan `Caddyfile`.
`app.set('trust proxy', 1)` membuat Express membaca IP pengguna asli dari header Caddy.

## 3. Konfigurasi salah baru ketahuan saat pengguna login

**Masalah.** Jika `JWT_SECRET` kosong, server tetap start. Error baru muncul sebagai 500
ketika seseorang login. Nilai contoh dari `.env.example` juga diterima di production.

**Perbaikan.** `server.js` memeriksa konfigurasi saat start dan berhenti dengan pesan jelas
jika `JWT_SECRET` kosong, kurang dari 32 karakter, atau masih nilai contoh di production,
atau jika `DB_HOST`/`DB_USER`/`DB_NAME` kosong.

## 4. Login bisa ditebak tanpa batas (brute force)

**Masalah.** Tidak ada batas percobaan. Satu orang bisa mencoba ribuan password per menit.

**Perbaikan.** `express-rate-limit`: 20 percobaan login/register per 15 menit untuk setiap
email. Dihitung per email, bukan per IP, karena semua request dari frontend Vercel datang dari
IP Vercel. Jika dihitung per IP, satu kelas akan berbagi batas yang sama.

## 5. Response API bisa tersimpan di cache Vercel

**Masalah.** Vercel bisa menyimpan (cache) response dari server lain yang diteruskan lewat
rewrite. Response API berisi data per pengguna dan tidak boleh disimpan.

**Perbaikan.** Semua response `/api/...` mengirim header `Cache-Control: no-store`.

## 6. Tidak ada security header

**Masalah.** Response tidak punya header keamanan dan masih mengirim `X-Powered-By: Express`.

**Perbaikan.** `helmet` menambahkan Content-Security-Policy, `nosniff`, dan header lain.
`upgrade-insecure-requests` dimatikan agar mode latihan tanpa domain (`http://IP_VPS`) tetap memuat CSS/JS.

## 7. Log error tidak berguna saat debugging di server

**Masalah.** Error handler hanya mencatat `err.name` (misalnya `Error`). Di server, tidak ada
cara mengetahui penyebab error 500.

**Perbaikan.** Log server mencatat method, URL, pesan, dan stack trace (`docker compose logs app`). Client
tetap hanya menerima pesan umum, jadi detail internal tidak bocor.

## 8. Health check tidak memeriksa database

**Masalah.** `/health` selalu `ok`, walaupun database mati atau password salah.

**Perbaikan.** `/health` tetap memeriksa proses saja. `/health/ready` menjalankan `SELECT 1`
dan menjawab 503 jika database tidak terhubung. Ini endpoint pertama yang dicek setelah deploy.

## 9. Restart memutus request yang sedang berjalan

**Masalah.** Saat container dihentikan (misalnya setelah deploy ulang), proses langsung mati.

**Perbaikan.** Graceful shutdown: saat menerima `SIGTERM`, server berhenti menerima request
baru, menyelesaikan request aktif, menutup koneksi database, lalu keluar.

## 10. Script npm rusak

**Masalah.** `docs:check` dan `test:postman` membaca folder `postman/` yang tidak ada di repo,
jadi keduanya selalu gagal.

**Perbaikan.** `docs:check` kini hanya memvalidasi `openapi.json`. `test:postman` dan `newman`
dihapus. Sebagai gantinya ada `npm test` (test otomatis) dan `npm run smoke -- <url>`.

## 11. Dependency dengan celah keamanan

**Masalah.** `npm audit` melaporkan celah pada `mysql2`, `body-parser`, `qs`, dan lainnya.

**Perbaikan.** Dependency di-upgrade. `npm audit` kini melaporkan 0 vulnerabilities.

## 12. Bug kecil di halaman web

**Masalah.** Tombol **Keluar** punya salinan kode logout sendiri yang lupa menampilkan pesan
"Koleksi tersedia setelah kamu masuk.", sehingga daftar produk kosong tanpa penjelasan.

**Perbaikan.** Tombol Keluar memakai fungsi `clearSession()` yang sama dengan logout otomatis.

## 13. Lain-lain

- Nama tabel `fwd12_day47` diganti menjadi `products`.
- Versi Node dikunci ke `24.x` (`backend/package.json`) dan `backend/.nvmrc`.
- `.gitignore` juga mengabaikan `.env.*` dan `.vercel/`.

## 14. Setup server manual sulit diulang

**Masalah.** Node.js, MySQL, dan web server dipasang satu per satu di VPS. Versi di VPS bisa berbeda
dengan laptop, dan langkah yang terlewat sulit dicari.

**Perbaikan.** Docker. `backend/Dockerfile` membuat image backend (Node.js 24, berjalan sebagai
user `node`, bukan root). `docker-compose.yml` menjalankan Caddy, backend, dan MySQL dengan satu
perintah: `docker compose up -d --build`. MySQL membuat tabel dari `backend/db/schema.sql` saat
database pertama kali dibuat. Perintah yang sama berjalan di laptop dan di VPS. File-file ini
juga bisa disalin ke app Express siswa sendiri (baris yang perlu diubah ditandai `SESUAIKAN`).

## 15. Backend tanpa HTTPS

**Masalah.** Backend di VPS hanya bisa diakses lewat `http://IP_VPS`. Data antara Vercel dan
VPS, termasuk password dan token login, dikirim tanpa enkripsi.

**Perbaikan.** Domain sendiri (`api.domainkamu.com`) dan **Caddy**. Caddy meminta sertifikat
HTTPS gratis dari Let's Encrypt, memperpanjangnya sendiri, dan mengalihkan `http://` ke
`https://`. Lihat `docs/BELI-DOMAIN.md` dan `Caddyfile`.

## 16. Tidak ada backup database

**Masalah.** Jika VPS rusak, terhapus, atau data terhapus karena salah perintah, semua data hilang.

**Perbaikan.** `backup-db.sh` membuat backup harian (dijadwalkan dengan cron) dan menyimpan 14
backup terakhir. Panduan VPS juga menjelaskan cara menyimpan salinan di luar VPS dan cara restore.

## 17. Server VPS tidak diamankan

**Masalah.** Login root dengan password terbuka untuk seluruh internet, tidak ada update keamanan
otomatis, dan log container bisa tumbuh sampai disk penuh.

**Perbaikan.** Panduan VPS: login hanya dengan SSH key, login root dan password dimatikan,
firewall UFW, update keamanan otomatis, swap, batas ukuran log container, dan monitoring.
