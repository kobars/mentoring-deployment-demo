# 0. Siapkan aplikasimu sendiri

**Lewati panduan ini jika kamu men-deploy aplikasi demo di repo ini.**

Panduan ini menyiapkan project **Express + MySQL** dan **React** milikmu, agar bisa di-deploy
dengan panduan 1–3. Semua langkah dikerjakan di laptop.

## 1. Salin file deploy dari repo demo

```text
project-kamu/
├── docker-compose.yml   ← salin
├── Caddyfile            ← salin
├── backup-db.sh         ← salin
├── backend/             (nama folder boleh lain, misalnya server/)
│   ├── Dockerfile       ← salin
│   └── .dockerignore    ← salin
└── frontend/            (nama folder boleh lain, misalnya client/)
    └── vercel.json      ← salin
```

Tambahkan dua baris ini ke `.gitignore`:

```text
.env
backups/
```

Backend dan frontend ada di **dua repo terpisah**? Taruh `docker-compose.yml`, `Caddyfile`,
`backup-db.sh`, `Dockerfile`, dan `.dockerignore` di folder utama repo backend, lalu ganti
setiap `./backend` di `docker-compose.yml` menjadi `.`. Taruh `vercel.json` di repo frontend.

## 2. Ubah baris bertanda `SESUAIKAN`

| File | Yang diubah | Contoh |
| --- | --- | --- |
| `backend/Dockerfile` | File utama backend | `CMD ["node", "index.js"]` |
| `docker-compose.yml` | Nama folder backend (3 tempat) | `./server` |
| `docker-compose.yml` | File SQL pembuat tabel | `./server/sql/init.sql` |
| `Caddyfile` | Port backend, jika bukan 3000 | `reverse_proxy app:5000` |

Domain di `Caddyfile` dan `vercel.json` diisi nanti, di panduan 2 dan 3.

## 3. Cek kode backend

**Wajib.** Tanpa ini, backend gagal di Docker atau di Vercel:

| Cek | Jika belum |
| --- | --- |
| `package-lock.json` ada dan di-commit | Jalankan `npm install`, lalu commit file itu. |
| Port dibaca dari `process.env.PORT` | `const PORT = process.env.PORT \|\| 3000;` |
| `app.listen(PORT)` tanpa `'localhost'` | Hapus argumen host. Di Docker, `localhost` hanya bisa diakses dari container itu sendiri. |
| Koneksi database dibaca dari `process.env` | `host: process.env.DB_HOST`, dan seterusnya. Di Docker, host MySQL bernama `db`. |
| Ada file `.sql` pembuat tabel | Export tabel dari laptop, atau tulis `CREATE TABLE ...`. MySQL menjalankannya saat database pertama kali dibuat. |
| Semua route API diawali `/api` | Lihat langkah 5, "Backend tanpa awalan `/api`". |

**Disarankan untuk production.** Contoh untuk setiap baris ada di aplikasi demo (`backend/`):

| Tambahkan | Kenapa |
| --- | --- |
| `app.set('trust proxy', 1)` | Caddy ada di depan Express. Tanpa ini, `req.ip` selalu berisi IP Caddy. |
| `app.use(helmet())` | Header keamanan HTTP (`npm install helmet`). |
| `Cache-Control: no-store` untuk `/api` | Vercel bisa menyimpan (cache) response. Data per pengguna tidak boleh disimpan. Lihat `backend/app.js`. |
| Rate limit untuk login | Mencegah tebak password. Lihat `backend/middlewares/rateLimit.js`. |
| Error handler tanpa stack trace | Detail error membantu penyerang. Lihat `backend/middlewares/errorHandler.js`. |
| Route `GET /health` | Untuk monitoring. `app.get('/health', (req, res) => res.json({ status: 'ok' }))` |

## 4. Tambahkan baris MySQL ke `.env.example`

Container `db` (MySQL) dan `app` (backend) membaca file `.env` yang sama di folder backend.
Nama variabel backend boleh berbeda di aplikasimu. Yang penting, **nilainya sama**:

```bash
# Untuk container MySQL
MYSQL_DATABASE=nama_database
MYSQL_USER=nama_user
MYSQL_PASSWORD=password

# Untuk backend: nilainya sama dengan baris MYSQL_* di atas
DB_HOST=db
DB_NAME=nama_database
DB_USER=nama_user
DB_PASSWORD=password
NODE_ENV=production
PORT=3000
```

Contoh lengkap: `backend/.env.example` di repo demo.

## 5. Cek kode frontend

**Panggil API dengan alamat relatif**, tanpa `http://...`:

```js
// Benar
fetch('/api/products')
axios.create({ baseURL: '/api' })

// Salah
fetch('http://localhost:3000/api/products')
axios.create({ baseURL: import.meta.env.VITE_API_URL })
```

Cari kata `localhost:` dan `http` di folder `src/`, lalu ganti.

**Tambahkan proxy di `vite.config.js`**, agar alamat relatif tetap berjalan saat `npm run dev`:

```js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:3000' }, // port backend lokal kamu
  },
})
```

**Backend tanpa awalan `/api`?** (misalnya route `/products` dan `/login`). Frontend tetap
memanggil `/api/products`. Lalu:

- Di `vercel.json`, buang `/api` dari tujuan: `"destination": "https://api.domainkamu.com/:path*"`.
- Di proxy Vite: `'/api': { target: 'http://localhost:3000', rewrite: path => path.replace(/^\/api/, '') }`.

## 6. Coba di laptop

Butuh **Docker Desktop**. Buat `backend/.env` dari `backend/.env.example` dan isi passwordnya,
lalu jalankan di folder utama repo:

```bash
docker compose up -d --build
```

**Cek:** `http://localhost/api/...` (salah satu route GET kamu) menjawab JSON. Log Caddy berisi
error sertifikat untuk domain contoh. Itu normal di laptop.

Hentikan dengan `docker compose down`. Commit dan push semua file, kecuali `.env`.

Lanjut ke [1. Beli domain](1-beli-domain.md).
