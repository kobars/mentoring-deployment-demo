# 1. Beli VPS dan domain di Rumah Web

**VPS** adalah server Linux milik kita sendiri. Backend dan database berjalan di sini.

**Domain** adalah nama alamat website, misalnya `tokokamu.com`. Kita butuh domain agar backend
bisa memakai **HTTPS** (koneksi terenkripsi).

Beli VPS lebih dulu, karena domain harus diarahkan ke IP VPS.

**DNS** adalah "buku alamat" internet. Isinya disebut **record**:

| Record | Fungsi | Contoh |
| --- | --- | --- |
| **A** | Nama → alamat IP | `api.tokokamu.com` → `103.150.10.20` |
| **CNAME** | Nama → nama lain | `www.tokokamu.com` → `abc123.vercel-dns-017.com` |

Rencana alamat (ganti `domainkamu.com` dengan domain kamu):

| Alamat | Isi | Mengarah ke | Dibuat di |
| --- | --- | --- | --- |
| `api.domainkamu.com` | Backend | IP VPS | Panduan ini |
| `domainkamu.com` dan `www` | Frontend | Vercel | [Panduan 3](3-deploy-frontend-vercel.md) |

## 1. Beli VPS

Harga di Rumah Web, Oktober 2026 (cek lagi sebelum membeli):

| Paket | RAM | Harga per bulan | Keterangan |
| --- | --- | --- | --- |
| XS | 512 MB | Rp 50.000 | Tidak cukup. |
| S | 1 GB | Rp 60.000 | Pas-pasan, bisa kehabisan memori. |
| **M** | **2 GB** | **Rp 120.000** | **Disarankan.** |

1. Buka https://www.rumahweb.com/vps-murah/.
2. Pilih paket **M** atau lebih besar. Saat diminta memilih OS, pilih **Ubuntu 24.04**.
3. Login atau buat akun Rumah Web, lalu bayar.

Setelah VPS aktif, ambil data login VPS:

1. Login ke **Clientzone** Rumah Web.
2. **VPS** → **Manage** pada VPS kamu.
3. Buka bagian **Account Information**. Jika belum terlihat, klik **Manage VPS** dulu.

**Cek:** kamu sudah mencatat **IP VPS** dan **password root**. Username-nya `root`. Jangan bagikan
password ini.

## 2. Pilih domain

Harga di Rumah Web, Oktober 2026 (cek lagi sebelum membeli):

| Ekstensi | Tahun pertama | Perpanjangan per tahun | Cocok untuk |
| --- | --- | --- | --- |
| `.my.id` | Rp 9.900 | Rp 25.000 | Belajar, portofolio |
| `.com` | Rp 137.000 | Rp 219.000 | Bisnis, internasional |
| `.id` | Rp 219.000 | Rp 219.000 | Bisnis di Indonesia |

Lihat **harga perpanjangan**, bukan hanya tahun pertama. Pilih nama yang pendek dan mudah dieja.

## 3. Beli domain

1. Buka https://www.rumahweb.com → halaman **Domain**.
2. Cari nama domain, pilih yang tersedia, lalu checkout. **Tidak perlu membeli hosting.**
3. Login dengan akun Rumah Web (akun yang sama dengan VPS).
4. Isi data pemilik domain dengan data asli, lalu bayar.

**Cek:** kamu menerima email bahwa domain aktif.

Setelah membeli:

- Untuk `.com` dan ekstensi internasional lain: klik link di **email verifikasi pemilik** dalam
  15 hari. Jika tidak, domain bisa dinonaktifkan.
- Pasang pengingat di kalender sebulan sebelum domain kedaluwarsa. Domain yang terlambat
  diperpanjang membuat website mati, dan menebusnya mahal.

## 4. Buka DNS Management

1. Login ke **Clientzone** Rumah Web.
2. **Domain** → **Manage** pada domain kamu → **DNS Management**.
3. Jika muncul tombol **Daftar**, **Aktifkan**, atau **Ubah Nameserver**, klik sampai tidak ada
   lagi tombol update.

## 5. Arahkan `api` ke IP VPS

Klik **Add New Record**, lalu isi:

| Kolom | Isi |
| --- | --- |
| Nama / Host | `api` |
| Type | `A` |
| Record / Value | IP VPS dari langkah 1, misalnya `103.150.10.20` |
| TTL | Biarkan default |

**Cek** dari terminal laptop (biasanya beberapa menit, paling lama sekitar 24 jam):

```bash
nslookup api.domainkamu.com
```

Hasilnya harus menampilkan IP VPS kamu di bagian `Address`. Bisa juga dicek di
https://dnschecker.org.

Lanjut ke [2. Deploy backend ke VPS](2-deploy-backend-vps.md).

## Troubleshooting

| Gejala | Perbaiki |
| --- | --- |
| `nslookup`: `can't find` atau `NXDOMAIN` | Cek record di DNS Management. Tunggu, lalu coba lagi. |
| `nslookup` menampilkan IP lain | Hapus record lama untuk `api`. Cek IP yang diketik. |
| Record tidak berpengaruh | Domain memakai nameserver lain (misalnya Cloudflare). Tambahkan record di panel DNS penyedia itu. |
| Domain tidak aktif setelah beberapa hari | Klik link di email verifikasi pemilik (cek folder spam). |
