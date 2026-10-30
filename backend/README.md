# Backend demo: Product API

Express, MySQL, bcrypt, JWT, dan Swagger. Cara deploy: [README utama](../README.md).

## Struktur

```text
server.js             Menjalankan server.
app.js                Express app: middleware, route, Swagger, error handler.
routes/ controllers/ models/ middlewares/ config/ auth/ utils/
db/schema.sql         Tabel dan data contoh. Dijalankan MySQL saat database pertama kali dibuat.
docs/openapi.json     Spesifikasi API untuk Swagger (/api-docs).
scripts/              Setup database, cek database, cek OpenAPI, smoke test.
test/                 Test otomatis (tidak butuh database).
Dockerfile            Resep image Docker.
.env.example          Contoh .env.
```

## Environment variable (`.env`)

Container `db` dan `app` sama-sama membaca file ini.

| Nama | Dibaca oleh | Keterangan |
| --- | --- | --- |
| `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` | `db` | Database dan user yang dibuat MySQL saat pertama kali start. |
| `DB_HOST` | `app` | `db` (nama container MySQL), bukan `localhost`. |
| `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | `app` | Harus sama dengan nilai `MYSQL_*`. |
| `NODE_ENV`, `PORT` | `app` | `production` dan `3000`. |
| `JWT_SECRET` | `app` | Minimal 32 karakter. Server menolak start jika kosong, terlalu pendek, atau masih nilai contoh. |
| `JWT_EXPIRES_IN` | `app` | Default `1d`. |

## Perintah npm

| Perintah | Fungsi |
| --- | --- |
| `npm start` | Menjalankan server tanpa Docker. |
| `npm run db:setup` | Membuat tabel. Aman dijalankan berulang kali. |
| `npm run db:check` | Menampilkan versi MySQL dan isi tabel. |
| `npm test` | Test otomatis tanpa database (butuh Node.js 24 dan `npm install`). |
| `npm run check` | Validasi `openapi.json` + `npm test`. |
| `npm run smoke -- <url>` | Menguji alur lengkap pada server yang sudah jalan. |

Perintah yang butuh database dijalankan di container, dari folder utama repo:

```bash
docker compose exec app npm run db:check
docker compose exec app npm run smoke -- http://localhost:3000
```

Smoke test membuat akun `smoke-<waktu>@example.com` dan satu produk, lalu menghapus produk itu.

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

Login dan register dibatasi 20 percobaan per 15 menit untuk setiap email (429 jika terlampaui).
