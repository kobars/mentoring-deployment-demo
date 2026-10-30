# Mentoring Deployment Demo

Panduan deploy aplikasi **Express + MySQL** (backend) dan **React** (frontend) ke production:

- Backend dan database di **VPS Rumah Web**, dengan Docker dan HTTPS otomatis.
- Frontend di **Vercel**.
- Domain sendiri dari **Rumah Web**.

```text
Browser ──► https://domainkamu.com            Vercel (frontend)
        └─► https://domainkamu.com/api/...    Vercel meneruskan ke https://api.domainkamu.com
                                              VPS: caddy ──► app (Express) ──► db (MySQL)
```

Repo ini juga berisi aplikasi demo (Product API) yang dipakai di video.

## Cara deploy

Ikuti berurutan:

| Panduan | Isi |
| --- | --- |
| [0. Siapkan aplikasimu sendiri](docs/0-siapkan-aplikasi.md) | Hanya jika memakai aplikasimu sendiri: salin file deploy dan cek kode. Lewati untuk aplikasi demo. |
| [1. Beli domain](docs/1-beli-domain.md) | Beli domain di Rumah Web, arahkan `api` ke VPS. |
| [2. Deploy backend ke VPS](docs/2-deploy-backend-vps.md) | Amankan server, pasang Docker, jalankan backend dengan HTTPS, backup harian. |
| [3. Deploy frontend ke Vercel](docs/3-deploy-frontend-vercel.md) | Import ke Vercel, pasang domain. |
| [4. Setelah deploy](docs/4-setelah-deploy.md) | Deploy ulang, restore backup, monitoring, perawatan. |

## Isi repo

```text
docker-compose.yml    Menjalankan caddy, app (backend), dan db (MySQL) di VPS.
Caddyfile             Domain API dan HTTPS otomatis.
backup-db.sh          Backup database harian.
backend/              Aplikasi demo: Express API. Berisi Dockerfile dan .env.example.
frontend/             Aplikasi demo: halaman web. Berisi vercel.json.
docs/                 Panduan deploy.
```

File yang disalin ke aplikasimu sendiri: `docker-compose.yml`, `Caddyfile`, `backup-db.sh`,
`backend/Dockerfile`, `backend/.dockerignore`, dan `frontend/vercel.json`. Baris yang perlu
diubah ditandai `SESUAIKAN`.

## Aplikasi demo

- Endpoint, perintah npm, dan environment variable: [backend/README.md](backend/README.md).
- Apa yang diperbaiki dari versi kelas (Day 48), dan kenapa: [docs/AUDIT.md](docs/AUDIT.md).

Jalankan di laptop (butuh Docker Desktop):

```bash
cp backend/.env.example backend/.env
docker compose up -d --build
```

Isi password di `backend/.env` dulu (lihat komentar di file itu). Lalu buka
http://localhost/api-docs/. Hentikan dengan `docker compose down`.
