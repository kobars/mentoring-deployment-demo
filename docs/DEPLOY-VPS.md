# Deploy backend Express ke VPS Rumah Web (Docker + HTTPS)

Panduan ini untuk **backend Express + MySQL kamu sendiri**, dan siap untuk production. Demo di
repo ini (folder `backend/`) memakai langkah yang sama persis.

**VPS** (Virtual Private Server) adalah server Linux milik kita sendiri. Panduan ini memakai
**Ubuntu 24.04**.

**Docker** menjalankan aplikasi di dalam **container**. Container adalah "kotak" berisi aplikasi
beserta semua yang dibutuhkannya. Di VPS kita hanya memasang Docker. Node.js, MySQL, dan web
server berjalan di dalam container.

```text
Internet ──► [caddy] 80/443 (HTTPS) ──► [app] Express :3000 ──► [db] MySQL :3306
             └───────────────────────── jaringan Docker ─────────────────────────┘
```

| Container | Isi | Dibuka ke internet? |
| --- | --- | --- |
| `caddy` | Web server. Memasang HTTPS otomatis, lalu meneruskan request ke `app`. | Ya, port 80 dan 443 |
| `app` | Backend Express kamu (dibuat dari `Dockerfile`). | Tidak |
| `db` | MySQL 8.4. Data disimpan di volume `db-data`. | Tidak |

**HTTPS** mengenkripsi data antara browser (atau Vercel) dan server, sehingga password dan token
login tidak bisa dibaca orang lain di jaringan. **Caddy** meminta sertifikat HTTPS gratis dari
Let's Encrypt dan memperpanjangnya sendiri. Kita tidak perlu mengurus sertifikat.

## Yang dibutuhkan

- **Domain** dengan record `api` yang mengarah ke IP VPS. Lihat [panduan beli domain](BELI-DOMAIN.md).
- VPS Rumah Web dengan OS **Ubuntu 24.04**. VPS Rumah Web memakai virtualisasi **KVM**, jadi
  Docker bisa dipasang. IP dan password root ada di email aktivasi atau Client Area Rumah Web.
- RAM: paket **M (2 GB)** disarankan. Demo ini memakai sekitar 500 MB (MySQL sekitar 450 MB),
  ditambah Ubuntu dan Docker. Paket S (1 GB) masih bisa tetapi pas-pasan. Paket XS (512 MB)
  tidak cukup.
- Repo GitHub berisi backend kamu.

Di panduan ini, ganti:

- `IP_VPS` dengan IP VPS kamu.
- `domainkamu.com` dengan domain kamu.

## 0. Siapkan repo (di laptop)

### Untuk semua, termasuk demo: isi domain di `Caddyfile`

Buka `Caddyfile`, lalu ganti `api.domainkamu.com` dengan subdomain API kamu. Commit dan push.

### Hanya untuk app kamu sendiri: salin file deploy

| File di repo demo | Taruh di project kamu | Fungsi |
| --- | --- | --- |
| `backend/Dockerfile` | folder backend | Resep image backend. |
| `backend/.dockerignore` | folder backend | File yang tidak ikut masuk image. |
| `docker-compose.yml` | folder utama repo | Menjalankan `caddy`, `app`, dan `db`. |
| `Caddyfile` | folder utama repo | Konfigurasi Caddy (domain dan HTTPS). |
| `backup-db.sh` | folder utama repo | Backup database harian. |

Tambahkan juga baris `backups/` ke `.gitignore`.

Jika backend dan frontend kamu ada di **dua repo terpisah**, taruh file-file di atas di folder
utama repo backend, lalu ganti setiap `./backend` di `docker-compose.yml` menjadi `.`.

Lalu sesuaikan baris bertanda `SESUAIKAN`:

| File | Yang disesuaikan | Contoh |
| --- | --- | --- |
| `Dockerfile` | File utama backend | `CMD ["node", "index.js"]` |
| `docker-compose.yml` | Nama folder backend (3 tempat) | `./server` |
| `docker-compose.yml` | Lokasi file SQL pembuat tabel | `./server/sql/init.sql` |
| `Caddyfile` | Subdomain API | `api.tokokamu.com` |
| `Caddyfile` | Port backend, jika bukan 3000 | `reverse_proxy app:5000` |

### Wajib: cek kode backend kamu

| Cek | Kenapa | Jika belum |
| --- | --- | --- |
| `package-lock.json` ada dan di-commit | `npm ci` di Dockerfile membutuhkannya. | Jalankan `npm install`, lalu commit `package-lock.json`. |
| Port dibaca dari `process.env.PORT` | Nilai `PORT` diatur di `.env`. | `const PORT = process.env.PORT \|\| 3000;` |
| `app.listen(PORT)` tanpa `'localhost'` | Di Docker, `localhost` hanya bisa diakses dari container itu sendiri. Caddy ada di container lain. | Hapus argumen host: `app.listen(PORT, ...)`. |
| Koneksi database dibaca dari `process.env` | Di Docker, host MySQL bernama `db`, bukan `localhost`. | `host: process.env.DB_HOST`, dan seterusnya. |
| Ada file `.sql` pembuat tabel | MySQL menjalankannya saat database pertama kali dibuat. | Export tabel dari laptop, atau tulis `CREATE TABLE ...`. |
| Route API diawali `/api` | Vercel hanya meneruskan `/api/...` ke VPS. | Lihat [panduan Vercel](DEPLOY-VERCEL.md), bagian "Backend tanpa awalan /api". |
| `.env` ada di `.gitignore` | Password tidak boleh masuk GitHub. | Tambahkan baris `.env` ke `.gitignore`. |

### Disarankan untuk production

Demo di repo ini sudah memakai semuanya. Lihat `backend/app.js` sebagai contoh.

| Rekomendasi | Kenapa | Contoh |
| --- | --- | --- |
| `app.set('trust proxy', 1)` | Caddy ada di depan Express. Tanpa ini, `req.ip` selalu berisi IP Caddy. | Taruh setelah `const app = express()`. |
| `helmet()` | Menambahkan header keamanan HTTP. | `npm install helmet`, lalu `app.use(helmet())`. |
| `Cache-Control: no-store` untuk `/api` | Vercel bisa menyimpan (cache) response yang diteruskan lewat rewrite. Data per pengguna tidak boleh disimpan. | Lihat `backend/app.js`. |
| Rate limit untuk login | Mencegah orang menebak password ribuan kali. | `express-rate-limit`. Lihat `backend/middlewares/rateLimit.js`. |
| Error handler tidak mengirim stack trace | Detail error membantu penyerang. Catat di log, kirim pesan umum ke client. | Lihat `backend/middlewares/errorHandler.js`. |
| Route `GET /health` | Untuk monitoring (langkah 8). | `app.get('/health', (req, res) => res.json({ status: 'ok' }))` |

### Tambahkan baris MySQL ke `.env.example`

Container `db` dan `app` sama-sama membaca file `.env` di folder backend. Tambahkan tiga baris
untuk MySQL. Nama variabel backend (`DB_HOST`, dan lainnya) boleh berbeda di app kamu. Yang
penting, **nilainya sama**:

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

Lihat contoh lengkap di `backend/.env.example`.

### Coba di laptop dulu (disarankan)

Dengan **Docker Desktop** terpasang, buat `backend/.env` dari `backend/.env.example`, lalu jalankan
di folder utama repo:

```bash
docker compose up -d --build
```

Buka `http://localhost/api/...` (salah satu route kamu). Log Caddy akan berisi error sertifikat
untuk domain kamu. Itu normal: domain mengarah ke VPS, bukan ke laptop. Hentikan dengan
`docker compose down`. Commit dan push semua file (kecuali `.env`).

## 1. Amankan server

### Login pertama dan buat user `deploy`

Dari terminal laptop:

```bash
ssh root@IP_VPS
```

Update paket, atur zona waktu, dan buat user `deploy`. Jangan menjalankan aplikasi sebagai root.

```bash
apt update && apt upgrade -y
timedatectl set-timezone Asia/Jakarta
adduser deploy
usermod -aG sudo deploy
```

### Login dengan SSH key, bukan password

**SSH key** adalah pasangan kunci: kunci privat tetap di laptop, kunci publik disimpan di VPS.
Login dengan key jauh lebih aman daripada password, karena key tidak bisa ditebak.

Di terminal **laptop** (bukan di VPS). Jika kamu sudah punya key, lewati `ssh-keygen`:

```bash
ssh-keygen -t ed25519
ssh-copy-id deploy@IP_VPS
```

Di Windows (PowerShell), `ssh-copy-id` tidak ada. Pakai perintah ini:

```powershell
type $env:USERPROFILE\.ssh\id_ed25519.pub | ssh deploy@IP_VPS "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

Cek dari **jendela terminal baru**. Login harus berhasil tanpa password VPS:

```bash
ssh deploy@IP_VPS
```

### Matikan login root dan login password

Lakukan ini **hanya jika login dengan key di atas sudah berhasil**. Jangan tutup jendela
terminal yang masih login, sampai langkah ini selesai dicek.

```bash
sudo tee /etc/ssh/sshd_config.d/00-hardening.conf > /dev/null <<'EOF'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
EOF
sudo sshd -t && sudo systemctl restart ssh
sudo sshd -T | grep -Ei '^(permitrootlogin|passwordauthentication)'
```

Hasilnya harus `permitrootlogin no` dan `passwordauthentication no`. Mulai sekarang, login
hanya dengan `ssh deploy@IP_VPS` dari laptop yang punya key.

### Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

Catatan: port yang dibuka oleh Docker (`ports:` di `docker-compose.yml`) tidak melewati UFW.
Karena itu, hanya container `caddy` yang punya `ports:`. **Jangan** menambahkan `ports:` ke
`db` atau `app`.

### Update keamanan otomatis

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

Pilih **Yes**. Ubuntu memasang update keamanan setiap hari secara otomatis.

### Swap (memori cadangan)

**Swap** adalah bagian disk yang dipakai sebagai memori cadangan. Swap mencegah build Docker
atau MySQL mati karena RAM habis. Cek dulu:

```bash
free -h
```

Jika baris `Swap` bernilai `0B`, buat swap 2 GB:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 2. Pasang Docker

Pasang Docker dengan script resmi dari Docker, lalu beri user `deploy` izin memakai Docker:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker deploy
exit
```

Login lagi (`ssh deploy@IP_VPS`) agar izin baru berlaku, lalu cek:

```bash
docker --version
docker compose version
docker run --rm hello-world
```

`hello-world` harus menampilkan `Hello from Docker!`.

## 3. Ambil kode dan isi `.env`

### Repo public

Ganti URL repo dengan repo kamu:

```bash
sudo mkdir -p /var/www
sudo chown deploy:deploy /var/www
cd /var/www
git clone https://github.com/kobars/mentoring-deployment-demo.git app
cd app
```

### Repo private

Buat **deploy key**: SSH key khusus VPS yang hanya bisa membaca satu repo.

```bash
ssh-keygen -t ed25519 -C "vps-deploy" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
```

Salin hasilnya ke GitHub: repo → **Settings** → **Deploy keys** → **Add deploy key**. Jangan
centang **Allow write access**. Lalu clone dengan alamat SSH:

```bash
sudo mkdir -p /var/www
sudo chown deploy:deploy /var/www
cd /var/www
git clone git@github.com:USERNAME/NAMA-REPO.git app
cd app
```

### Isi `.env`

```bash
cp backend/.env.example backend/.env
openssl rand -hex 32
openssl rand -hex 32
nano backend/.env
```

`openssl rand -hex 32` mencetak teks acak. Jalankan dua kali:

- Hasil pertama: isi ke `MYSQL_PASSWORD` **dan** `DB_PASSWORD` (nilainya harus sama).
- Hasil kedua: isi ke `JWT_SECRET` (jika app kamu memakai JWT).

Simpan (`Ctrl+O`, `Enter`, `Ctrl+X`). Kunci file agar hanya user `deploy` yang bisa membacanya:

```bash
chmod 600 backend/.env
```

Simpan juga salinan isi `.env` di tempat aman (misalnya password manager). Tanpa password ini,
backup database sulit dipakai.

## 4. Dockerization: apa yang akan dijalankan

**`Dockerfile`** adalah resep untuk membuat **image** backend. Image adalah cetakan; container
adalah hasil cetakan yang sedang berjalan. Resepnya:

1. Mulai dari image resmi `node:24-slim` (Linux kecil yang sudah berisi Node.js 24).
2. Salin `package.json` dan `package-lock.json`, lalu `npm ci --omit=dev`.
3. Salin semua file backend (kecuali yang ada di `.dockerignore`, misalnya `node_modules` dan `.env`).
4. Pindah ke user `node` (bukan root).
5. Saat container start: `node server.js`.

**`docker-compose.yml`** menjalankan tiga container sekaligus dan menghubungkannya:

- `db` memakai image `mysql:8.4`. Saat pertama kali start, MySQL membuat database dan user dari
  `MYSQL_*` di `.env`, lalu menjalankan file SQL pembuat tabel.
- `app` dibuat dari `Dockerfile`. Ia baru start setelah `db` siap, dan menghubungi MySQL lewat
  nama `db`.
- `caddy` memakai image `caddy:2.11-alpine` dan file `Caddyfile`. Sertifikat HTTPS disimpan di
  volume `caddy-data`.
- `restart: unless-stopped`: Docker menyalakan ulang container jika crash, dan setelah VPS reboot.
- `logging`: log setiap container dibatasi 3 file x 10 MB, agar disk tidak penuh.

## 5. Jalankan

Pastikan dulu `nslookup api.domainkamu.com` (dari laptop) sudah menampilkan IP VPS. Lalu:

```bash
docker compose up -d --build
```

- `--build`: buat image backend dari `Dockerfile`.
- `-d`: jalankan di background.

Start pertama butuh 1–3 menit (download image, inisialisasi MySQL, dan sertifikat HTTPS). Cek:

```bash
docker compose ps
docker compose logs app
docker compose logs caddy | grep -i "certificate obtained"
```

- Ketiga container harus `Up`, dan `db` berstatus `(healthy)`.
- Log `app` berisi pesan bahwa server berjalan, tanpa error.
- Log `caddy` berisi `certificate obtained successfully`. Artinya HTTPS aktif.

## 6. Cek backend dari internet

Buka salah satu route API kamu di browser: `https://api.domainkamu.com/api/...`. Jawabannya
harus JSON dari backend kamu, dengan ikon gembok (HTTPS) di address bar. Buka juga
`http://api.domainkamu.com/...`: browser harus pindah otomatis ke `https://`.

Untuk demo ini:

- `https://api.domainkamu.com/health/ready` → `{"status":"ok","database":"ok"}`
- `https://api.domainkamu.com/api-docs/` → Swagger
- Smoke test lengkap: `docker compose exec app npm run smoke -- https://api.domainkamu.com`.
  Semua langkah harus `PASS`.

## 7. Backup database setiap hari

`backup-db.sh` menyimpan isi database ke folder `backups/` dan menyimpan 14 backup terakhir.
Jalankan sekali untuk mengecek:

```bash
cd /var/www/app
./backup-db.sh
ls -lh backups/
```

Jadwalkan setiap hari jam 02.00 dengan **cron** (penjadwal tugas di Linux):

```bash
crontab -e
```

Pilih editor `nano` jika ditanya. Tambahkan baris ini di paling bawah, lalu simpan:

```text
0 2 * * * /var/www/app/backup-db.sh >> /var/www/app/backups/backup.log 2>&1
```

**Simpan salinan di luar VPS.** Backup di VPS tidak berguna jika VPS rusak atau terhapus.
Seminggu sekali, unduh backup terbaru ke laptop (jalankan di laptop):

```bash
scp deploy@IP_VPS:/var/www/app/backups/db-2026-10-30-0200.sql.gz .
```

**Restore** (mengembalikan database dari backup). Isi tabel diganti dengan isi backup:

```bash
gunzip -c backups/db-2026-10-30-0200.sql.gz | docker compose exec -T db sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" exec mysql -u"$MYSQL_USER" "$MYSQL_DATABASE"'
```

Coba restore sekali, agar kamu tahu backup-nya bisa dipakai.

## 8. Monitoring (disarankan)

Pakai layanan gratis seperti **UptimeRobot** (https://uptimerobot.com). Buat monitor **HTTP(s)**
ke `https://api.domainkamu.com/health` dengan interval 5 menit. Kamu menerima email jika backend
mati.

## Deploy versi baru

Setelah `git push` ke GitHub, jalankan di VPS:

```bash
cd /var/www/app
git pull
docker compose up -d --build
docker image prune -f
```

- Docker membuat image baru, lalu mengganti container `app`. Data MySQL tetap aman.
- `docker image prune -f` menghapus image lama, agar disk tidak penuh.

**Perubahan tabel tidak otomatis.** File SQL pembuat tabel hanya dijalankan saat database
pertama kali dibuat. Untuk menambah tabel atau kolom:

1. Backup dulu: `./backup-db.sh`.
2. Tulis perubahannya di file `.sql` baru, commit, push, lalu `git pull` di VPS.
3. Jalankan:

```bash
docker compose exec -T db sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" exec mysql -u"$MYSQL_USER" "$MYSQL_DATABASE"' < backend/db/perubahan.sql
```

## Perawatan rutin (sebulan sekali)

```bash
cd /var/www/app
docker compose pull
docker compose up -d
docker image prune -f
df -h /
```

- `docker compose pull` mengunduh versi terbaru image MySQL dan Caddy (perbaikan keamanan).
- `df -h /` menampilkan sisa disk. Jika penggunaan di atas 80%, hapus file yang tidak perlu
  atau upgrade paket VPS.

## Perintah Docker yang sering dipakai

Jalankan di folder `/var/www/app`.

| Perintah | Fungsi |
| --- | --- |
| `docker compose ps` | Melihat status container. |
| `docker compose logs -f app` | Melihat log backend secara live. `Ctrl+C` untuk keluar. |
| `docker compose logs caddy` | Melihat log Caddy (HTTPS dan request). |
| `docker compose restart app` | Restart backend. |
| `docker compose exec db sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" mysql -u"$MYSQL_USER" "$MYSQL_DATABASE"'` | Membuka MySQL client. Ketik `exit` untuk keluar. |
| `docker compose down` | Menghentikan dan menghapus container. Data tetap ada. |

**Jangan** menjalankan `docker compose down -v`. Opsi `-v` menghapus volume: semua data MySQL
dan sertifikat HTTPS.

## Belum punya domain? (hanya untuk latihan)

Untuk latihan di kelas, backend bisa berjalan tanpa domain, dengan HTTP biasa:

1. Di `Caddyfile`, ganti baris `api.domainkamu.com {` dengan `:80 {`.
2. Di `frontend/vercel.json`, pakai `http://IP_VPS/api/:path*`.
3. Lewati langkah yang menyebut domain dan sertifikat.

**Jangan pakai cara ini untuk aplikasi sungguhan.** Data antara Vercel dan VPS, dan antara
browser dan `http://IP_VPS`, tidak terenkripsi. Password dan token login bisa dibaca orang lain
di jaringan. Pakai data palsu, dan jangan memakai password asli.

## Troubleshooting

| Gejala | Penyebab umum | Cara cek dan perbaiki |
| --- | --- | --- |
| `docker compose ps`: `app` terus `Restarting` | Backend crash saat start | `docker compose logs app`, lalu lihat baris di bawah. |
| Log: `Cannot find module '/app/server.js'` | Nama file utama di `Dockerfile` salah | Perbaiki baris `CMD`, lalu `docker compose up -d --build`. |
| Log: `ECONNREFUSED 127.0.0.1:3306` | Backend menghubungi `localhost`, bukan `db` | Isi `DB_HOST=db` di `.env`, dan pastikan kode membaca `process.env.DB_HOST`. |
| Log: `Access denied for user` | Password di `.env` tidak sama, atau diubah setelah MySQL pertama kali start | Samakan `DB_PASSWORD` dan `MYSQL_PASSWORD`. Password MySQL hanya dibaca saat start pertama. |
| Log: `Table '...' doesn't exist` | File SQL tidak dijalankan atau lokasinya salah | Cek path di `docker-compose.yml`. Jika data boleh hilang: `docker compose down -v`, lalu `up -d` lagi. |
| `npm ci` gagal saat build | `package-lock.json` tidak ada atau tidak cocok dengan `package.json` | Di laptop: `npm install`, commit `package-lock.json`, push, lalu `git pull` di VPS. |
| Log `caddy`: error sertifikat, `NXDOMAIN`, atau `timeout` | Record `api` belum mengarah ke VPS, atau port 80/443 tertutup | `nslookup api.domainkamu.com` harus menampilkan IP VPS. `sudo ufw status` harus memuat 80 dan 443. Lalu `docker compose restart caddy`. |
| Browser: peringatan sertifikat tidak aman | Sertifikat belum didapat | Lihat baris di atas. Caddy mencoba lagi secara otomatis. |
| Browser: **502 Bad Gateway** | `app` mati, atau port di `Caddyfile` berbeda dengan `PORT` | `docker compose logs app`. Samakan port. |
| Tidak bisa login SSH | Key tidak cocok, atau login password sudah dimatikan | Masuk lewat fitur console/VNC di panel VPS Rumah Web (jika tersedia) atau hubungi support Rumah Web, lalu perbaiki `~/.ssh/authorized_keys`. |
| `permission denied ... docker.sock` | User `deploy` belum masuk grup `docker` | `exit`, lalu `ssh deploy@IP_VPS` lagi. |
| `backup-db.sh`: `Permission denied` | File belum bisa dieksekusi | `chmod +x backup-db.sh`. |
| Demo: log `JWT_SECRET ...` | Secret kosong, terlalu pendek, atau masih nilai contoh | Buat secret acak (langkah 3), lalu `docker compose up -d`. |
| Demo: 429 saat login | Rate limit: 20 percobaan per 15 menit per email | Tunggu 15 menit atau pakai email lain. |
