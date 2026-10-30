# 2. Deploy backend ke VPS Rumah Web

**VPS** adalah server Linux milik kita sendiri. Di VPS kita hanya memasang **Docker**. Docker
menjalankan tiga **container** (aplikasi yang terisolasi), yang diatur oleh `docker-compose.yml`:

```text
Internet ──► caddy (HTTPS, port 80/443) ──► app (Express, port 3000) ──► db (MySQL)
```

- `caddy` menerima request dari internet. Caddy memasang dan memperpanjang sertifikat HTTPS
  secara otomatis.
- `app` adalah backend, dibuat dari `backend/Dockerfile`.
- `db` adalah MySQL. Datanya disimpan di volume Docker, jadi tidak hilang saat container
  dibuat ulang. Hanya `caddy` yang bisa diakses dari internet.

**Yang dibutuhkan:**

- VPS sudah aktif, dan record `api.domainkamu.com` sudah mengarah ke IP VPS
  ([panduan 1](1-beli-vps-dan-domain.md)). IP dan password root ada di Clientzone
  (panduan 1, langkah 1).
- Repo GitHub berisi backend (dan [panduan 0](0-siapkan-aplikasi.md) sudah selesai, jika
  memakai aplikasimu sendiri).

Ganti `IP_VPS`, `NAMA_KEY`, dan `domainkamu.com` di semua perintah dengan milikmu. `NAMA_KEY`
dijelaskan di langkah 3.

**Perhatikan di mana perintah berjalan.** Kamu selalu mengetik di terminal laptop. Yang berubah
adalah tempat perintah itu berjalan:

| Panduan menulis | Artinya | Cara mengenalinya |
| --- | --- | --- |
| **Terminal laptop** | Belum login dengan `ssh`, atau sudah keluar dengan `exit`. | Baris terminal seperti biasa. |
| **Terminal VPS** | Sudah login dengan `ssh`. Perintah berjalan di VPS, bukan di laptop. | Baris terminal diawali `root@` atau `deploy@`. |

**Tempel satu blok perintah setiap kali, lalu tunggu sampai selesai.** Jangan menggabungkan beberapa
blok. Perintah `sudo` dan perintah yang meminta jawaban bisa menghapus baris tempelan sesudahnya,
tanpa pesan error. Karena itu, blok di panduan ini memakai `&&` (jalankan perintah berikutnya jika
perintah sebelumnya berhasil), dan `\` di akhir baris berarti perintahnya berlanjut ke baris berikut.

## 1. Isi domain di `Caddyfile` (di laptop)

Di `Caddyfile`, ganti `api.kobarmentoring.my.id` dengan subdomain API kamu. Commit dan push.

## 2. Login dan buat user `deploy`

Di **terminal laptop**, login ke VPS:

```bash
ssh root@IP_VPS
```

- Jika muncul `Are you sure you want to continue connecting`, ketik `yes`.
- Masukkan password root dari Clientzone. Terminal tidak menampilkan apa pun saat kamu mengetik.
  Ini normal.

**Cek:** baris terminal sekarang diawali `root@`. Terminal ini sudah menjadi **terminal VPS**.

Di **terminal VPS** itu, jalankan:

```bash
apt update && apt upgrade -y && timedatectl set-timezone Asia/Jakarta
```

Buat user `deploy`:

```bash
adduser deploy
```

`adduser` meminta password untuk user `deploy`. Ini password baru, bukan password root. Catat
password ini: `ssh-copy-id` dan `sudo` memintanya. Untuk pertanyaan `Full Name` dan seterusnya, tekan
`Enter`, lalu ketik `y`.

Beri user `deploy` akses `sudo` (izin menjalankan perintah admin), lalu cek hasilnya:

```bash
usermod -aG sudo deploy
id deploy
```

**Cek:** hasil `id deploy` memuat `sudo`.

## 3. Login dengan SSH key

**SSH key** adalah pasangan kunci. Kunci privat tetap di laptop, kunci publik disimpan di VPS.
Key tidak bisa ditebak seperti password.

Buat **key baru khusus untuk proyek ini**, walaupun kamu sudah punya key lain. Key yang sudah ada
di laptopmu (misalnya untuk GitHub) tidak berubah, jadi semua yang sudah berjalan tetap berjalan.

Pilih nama untuk key ini: huruf kecil, tanpa spasi, misalnya `tokokamu-vps`. Panduan ini
menulisnya `NAMA_KEY`. Ganti `NAMA_KEY` di semua perintah, dan catat namanya. Kamu memakainya
setiap kali login.

Ketik `exit` untuk keluar dari VPS. Baris terminal kembali seperti biasa. Semua perintah di bawah
dijalankan di **terminal laptop**, sampai pengecekan berhasil.

**Buat key:**

```bash
ssh-keygen -t ed25519 -f ~/.ssh/NAMA_KEY
```

Di Windows (PowerShell):

```powershell
ssh-keygen -t ed25519 -f $env:USERPROFILE\.ssh\NAMA_KEY
```

`-t ed25519` adalah jenis key. `-f` adalah lokasi dan nama file key.

| Pertanyaan | Jawaban |
| --- | --- |
| `Overwrite (y/n)?` | Ketik `n`, lalu ulangi dengan nama lain. Nama itu sudah dipakai key lain. Jangan menimpanya, karena login yang memakai key itu bisa gagal. |
| `Enter passphrase` | Buat passphrase (password untuk key ini) dan catat. Untuk melewatinya, tekan `Enter`. |
| `Enter same passphrase again` | Ketik passphrase yang sama, atau tekan `Enter` jika tadi dilewati. |

**Cek:** ada dua file baru di folder `.ssh`. `NAMA_KEY` adalah kunci privat: jangan dibagikan.
`NAMA_KEY.pub` adalah kunci publik: file ini yang dikirim ke VPS.

**Kirim kunci publik ke VPS:**

```bash
ssh-copy-id -i ~/.ssh/NAMA_KEY.pub deploy@IP_VPS
```

Di Windows (PowerShell), ganti `ssh-copy-id` dengan:

```powershell
type $env:USERPROFILE\.ssh\NAMA_KEY.pub | ssh deploy@IP_VPS "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

Masukkan password user `deploy` dari langkah 2.

**Login dengan key:**

```bash
ssh -i ~/.ssh/NAMA_KEY deploy@IP_VPS
```

`-i` memberi tahu `ssh` key mana yang dipakai. Key ini punya nama sendiri, jadi `ssh` tidak
menemukannya tanpa `-i`. **Mulai sekarang, selalu login dengan perintah ini.**

**Cek:** kamu masuk tanpa diminta password user `deploy`. Jika kamu membuat passphrase, yang
diminta adalah passphrase itu. Baris terminal diawali `deploy@`.

Sekarang matikan login root dan login password. Jalankan ini di **terminal VPS** yang baru saja
login sebagai `deploy`, dan **jangan tutup** terminal itu sampai pengecekan di bawah berhasil.
Jika diminta, masukkan password user `deploy`:

```bash
printf 'PermitRootLogin no\nPasswordAuthentication no\nKbdInteractiveAuthentication no\n' | sudo tee /etc/ssh/sshd_config.d/00-hardening.conf > /dev/null && \
sudo sshd -t && \
sudo systemctl restart ssh && \
sudo sshd -T | grep -Ei '^(permitrootlogin|passwordauthentication)'
```

**Cek:** hasilnya `permitrootlogin no` dan `passwordauthentication no`. Lalu buka terminal baru di
laptop: `ssh -i ~/.ssh/NAMA_KEY deploy@IP_VPS` masih bisa masuk.

## 4. Firewall, update otomatis, dan swap

Langkah 4 sampai 9 dijalankan di **terminal VPS**, sebagai `deploy`. Baris terminal diawali
`deploy@`.

**UFW** (firewall) hanya membuka SSH, HTTP, dan HTTPS. Jika diminta, masukkan password `deploy`:

```bash
sudo ufw allow OpenSSH && sudo ufw allow 80 && sudo ufw allow 443
```

```bash
sudo ufw enable
```

Ketik `y` saat muncul `Proceed with operation (y|n)?`.

`unattended-upgrades` memasang update keamanan setiap hari:

```bash
sudo apt install -y unattended-upgrades
```

```bash
sudo dpkg-reconfigure -plow unattended-upgrades
```

Pilih **Yes** saat ditanya.

**Swap** adalah disk yang dipakai sebagai memori cadangan, agar build tidak gagal saat RAM habis.
Jalankan `free -h`. Jika baris `Swap` bernilai `0B`:

```bash
sudo fallocate -l 2G /swapfile && \
sudo chmod 600 /swapfile && \
sudo mkswap /swapfile && \
sudo swapon /swapfile && \
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

**Cek:** `sudo ufw status` memuat 22, 80, dan 443. `free -h` menampilkan swap 2 GB.

## 5. Pasang Docker

```bash
curl -fsSL https://get.docker.com | sudo sh && sudo usermod -aG docker deploy && exit
```

`exit` membawamu kembali ke terminal laptop. Login lagi dengan
`ssh -i ~/.ssh/NAMA_KEY deploy@IP_VPS`, lalu jalankan di **terminal VPS**:

```bash
docker run --rm hello-world
```

**Cek:** muncul `Hello from Docker!`.

## 6. Ambil kode

```bash
sudo mkdir -p /var/www && sudo chown deploy:deploy /var/www && \
cd /var/www && \
git clone https://github.com/kobars/mentoring-deployment-demo.git app && \
cd app
```

Ganti URL dengan repo kamu.

**Repo private?** Buat deploy key (kunci khusus VPS yang hanya bisa membaca repo ini):

```bash
ssh-keygen -t ed25519 -C "vps-deploy" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
```

Tempel hasilnya di GitHub: repo → **Settings** → **Deploy keys** → **Add deploy key** (jangan
centang write access). Lalu clone dengan alamat SSH:
`git clone git@github.com:USERNAME/NAMA-REPO.git app`.

## 7. Isi `.env`

```bash
cp backend/.env.example backend/.env
openssl rand -hex 32
openssl rand -hex 32
nano backend/.env
```

`openssl rand -hex 32` mencetak teks acak. Pakai:

- hasil pertama untuk `MYSQL_PASSWORD` **dan** `DB_PASSWORD` (harus sama),
- hasil kedua untuk `JWT_SECRET`.

Simpan dengan `Ctrl+O`, `Enter`, `Ctrl+X`. Lalu kunci file:

```bash
chmod 600 backend/.env
```

Simpan salinan isi `.env` di password manager.

## 8. Jalankan

```bash
docker compose up -d --build
```

Start pertama butuh 1–3 menit: Docker membuat image backend, MySQL membuat database dan tabel,
dan Caddy meminta sertifikat HTTPS.

**Cek:**

```bash
docker compose ps
docker compose logs caddy | grep -i "certificate obtained"
```

- Ketiga container `Up`, dan `db` berstatus `(healthy)`.
- Log Caddy berisi `certificate obtained successfully`.
- Buka `https://api.domainkamu.com/api/...` (salah satu route GET kamu) di browser: muncul JSON,
  dengan ikon gembok.

Aplikasi demo: buka `https://api.domainkamu.com/health/ready` (harus `{"status":"ok","database":"ok"}`),
lalu jalankan `docker compose exec app npm run smoke -- https://api.domainkamu.com` (semua `PASS`).

## 9. Jadwalkan backup database

```bash
./backup-db.sh
crontab -e
```

Pilih `nano` jika ditanya. Tambahkan baris ini di paling bawah, lalu simpan:

```text
0 2 * * * /var/www/app/backup-db.sh >> /var/www/app/backups/backup.log 2>&1
```

Backup berjalan setiap hari jam 02.00. 14 backup terakhir disimpan di `backups/`.

**Cek:** `ls -lh backups/` menampilkan satu file `db-....sql.gz`.

Backend siap. Lanjut ke [3. Deploy frontend ke Vercel](3-deploy-frontend-vercel.md).
Untuk deploy ulang, restore backup, dan perawatan: [4. Setelah deploy](4-setelah-deploy.md).

## Belum punya domain? (hanya untuk latihan)

Kamu tetap butuh VPS ([panduan 1](1-beli-vps-dan-domain.md), langkah 1).

Di `Caddyfile`, ganti baris `api.kobarmentoring.my.id {` dengan `:80 {`. Backend bisa dibuka di
`http://IP_VPS`. **Jangan pakai untuk aplikasi sungguhan:** tanpa HTTPS, password dan token
login bisa dibaca orang lain di jaringan. Pakai data palsu.

## Troubleshooting

Mulai dari `docker compose ps` dan `docker compose logs app`.

| Gejala | Perbaiki |
| --- | --- |
| `app` terus `Restarting`, log `Cannot find module` | Nama file di baris `CMD` pada `Dockerfile` salah. |
| Log `ECONNREFUSED 127.0.0.1:3306` | Isi `DB_HOST=db` di `.env`, dan pastikan kode membaca `process.env.DB_HOST`. |
| Log `Access denied for user` | Samakan `DB_PASSWORD` dan `MYSQL_PASSWORD`. Password MySQL hanya dibaca saat start pertama: jika diubah setelahnya, kembalikan nilai lama. |
| Log `Table '...' doesn't exist` | Cek path file SQL di `docker-compose.yml`. Jika data boleh hilang: `docker compose down -v`, lalu `up -d` lagi. |
| `npm ci` gagal saat build | `package-lock.json` tidak ada atau tidak cocok. Di terminal laptop: `npm install`, commit, push. Di terminal VPS: `git pull`. |
| Log Caddy: `NXDOMAIN`, `timeout`, atau error sertifikat | `nslookup api.domainkamu.com` harus menampilkan IP VPS, dan `sudo ufw status` memuat 80 dan 443. Lalu `docker compose restart caddy`. |
| Browser: **502 Bad Gateway** | `app` mati, atau port di `Caddyfile` berbeda dengan `PORT` di `.env`. |
| `permission denied ... docker.sock` | Keluar (`exit`), lalu login lagi. |
| `Permission denied (publickey)` saat login | Kamu lupa `-i ~/.ssh/NAMA_KEY`, atau nama key salah. Daftar key ada di `ls ~/.ssh`. |
| Tidak bisa login SSH, walaupun key sudah benar | Masuk lewat console/VNC di panel VPS Rumah Web (jika tersedia) atau hubungi support, lalu perbaiki `~/.ssh/authorized_keys`. |
| Demo: log `JWT_SECRET ...` | Isi `JWT_SECRET` dengan teks acak (langkah 7), lalu `docker compose up -d`. |
