# Mentoring Demo — Product API

Aplikasi demo untuk belajar **deploy**. Aplikasi ini punya dua bagian:

| Bagian | Isi | Di-deploy ke |
| --- | --- | --- |
| `backend/` | Product API: Express, MySQL, bcrypt, JWT, Swagger | **VPS Rumah Web**, dengan Docker dan HTTPS |
| `frontend/` | Halaman web (HTML, CSS, JavaScript) | **Vercel** |

```text
Browser ──► https://domainkamu.com (Vercel: frontend/)
               └─ /api/* ──► https://api.domainkamu.com (VPS, Docker): caddy ──► app (Express) ──► db (MySQL)
```

Frontend memanggil `/api/...`. Di Vercel, `frontend/vercel.json` meneruskan semua request
`/api/...` ke VPS. Karena itu kode frontend tidak perlu diubah dan backend tidak perlu CORS.

## Panduan deploy (ikuti berurutan)

1. [Beli domain di Rumah Web dan arahkan ke VPS](docs/BELI-DOMAIN.md)
2. [Deploy backend ke VPS Rumah Web (Docker + HTTPS)](docs/DEPLOY-VPS.md)
3. [Deploy frontend ke Vercel (dengan domain sendiri)](docs/DEPLOY-VERCEL.md)

Panduan ini siap untuk production: HTTPS otomatis, server yang diamankan, backup database
harian, dan monitoring.

Apa saja yang diperbaiki dari versi kelas (Day 48) dan alasannya: [docs/AUDIT.md](docs/AUDIT.md).

## Deploy aplikasi milikmu sendiri

Panduan deploy bisa dipakai untuk aplikasi **Express + MySQL** dan **React** milikmu sendiri.
Salin file berikut, lalu ikuti langkah 0 di setiap panduan:

| File | Panduan |
| --- | --- |
| `backend/Dockerfile`, `backend/.dockerignore`, `docker-compose.yml`, `Caddyfile`, `backup-db.sh` | [docs/DEPLOY-VPS.md](docs/DEPLOY-VPS.md) |
| `frontend/vercel.json` | [docs/DEPLOY-VERCEL.md](docs/DEPLOY-VERCEL.md) |

Baris yang perlu diubah untuk app kamu ditandai `SESUAIKAN`.

## Struktur folder

```text
docker-compose.yml        Menjalankan 3 container di VPS: caddy, app (backend), db (MySQL).
Caddyfile                 Konfigurasi Caddy: domain API dan HTTPS otomatis.
backup-db.sh              Backup database harian (dijalankan oleh cron di VPS).
backend/
  Dockerfile              Resep image backend (Node.js 24).
  .env.example            Contoh .env: MySQL, backend, JWT.
  server.js               Menjalankan server (npm start, container Docker).
  app.js                  Membuat Express app (middleware, route, Swagger, error handler).
  routes/ controllers/ models/ middlewares/ config/ auth/ utils/
  db/schema.sql           Tabel dan data contoh. Dijalankan MySQL saat database pertama kali dibuat.
  docs/openapi.json       Spesifikasi API untuk Swagger.
  scripts/                Setup database, cek database, cek OpenAPI, smoke test.
  test/                   Test otomatis (tidak butuh database).
frontend/
  index.html, app.js, style.css
  vercel.json             Meneruskan /api/* ke VPS.
```

## Menjalankan di laptop

Butuh **Docker Desktop**. Perintahnya sama dengan di VPS.

```bash
cp backend/.env.example backend/.env
```

Di `backend/.env`, isi `MYSQL_PASSWORD` dan `DB_PASSWORD` dengan teks acak yang sama, dan
`JWT_SECRET` dengan teks acak lain (`openssl rand -hex 32`). Lalu:

```bash
docker compose up -d --build
```

Swagger ada di **http://localhost/api-docs/**. Log Caddy akan berisi error sertifikat untuk
`api.domainkamu.com`. Itu normal di laptop. Hentikan dengan `docker compose down`.

## Perintah npm (di folder `backend/`)

| Perintah | Fungsi |
| --- | --- |
| `npm start` | Menjalankan server tanpa Docker. |
| `npm run db:setup` | Membuat tabel `products` dan `users`. Aman dijalankan berulang kali. |
| `npm run db:check` | Menampilkan versi MySQL dan isi tabel. |
| `npm test` | Test otomatis tanpa database. Butuh Node.js 24 di laptop (`npm install` dulu). |
| `npm run check` | Validasi `openapi.json` + `npm test`. |
| `npm run smoke -- <url>` | Menguji alur lengkap pada server yang sudah jalan. |

Perintah yang butuh database dijalankan di dalam container, misalnya:

```bash
docker compose exec app npm run db:check
docker compose exec app npm run smoke -- http://localhost:3000
```

Smoke test membuat satu akun `smoke-<waktu>@example.com` dan satu produk, lalu menghapus produk itu.
Akun test tetap tersimpan di database.

## Environment variable (`backend/.env`)

Container `db` dan `app` sama-sama membaca file ini.

| Nama | Dibaca oleh | Keterangan |
| --- | --- | --- |
| `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` | `db` | Database dan user yang dibuat MySQL saat pertama kali start. |
| `DB_HOST` | `app` | `db` (nama container MySQL), bukan `localhost`. |
| `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | `app` | Harus sama dengan nilai `MYSQL_*`. |
| `NODE_ENV`, `PORT` | `app` | `production` dan `3000`. |
| `JWT_SECRET` | `app` | Minimal 32 karakter. Server menolak start jika kosong, terlalu pendek, atau masih nilai contoh. |
| `JWT_EXPIRES_IN` | `app` | Default `1d`. |

## Endpoint

| Method | Path | Auth | Hasil sukses |
| --- | --- | --- | --- |
| GET | `/health` | - | 200, proses server hidup |
| GET | `/health/ready` | - | 200 jika database terhubung, 503 jika tidak |
| POST | `/api/auth/register` | - | 201, akun dibuat |
| POST | `/api/auth/login` | - | 200, JWT pada `data.token` |
| GET | `/api/products?name=` | Bearer | 200, array pada `data` |
| POST | `/api/products` | Bearer | 201, produk pada `data` |
| GET | `/api/products/:id` | Bearer | 200, detail produk |
| PUT | `/api/products/:id` | Bearer | 200, seluruh field diperbarui |
| PATCH | `/api/products/:id` | Bearer | 200, harga diperbarui |
| DELETE | `/api/products/:id` | Bearer | 204, body kosong |

Login dan register dibatasi 20 percobaan per 15 menit untuk setiap email.
Jika terlampaui, server menjawab **429**.
