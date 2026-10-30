# Beli domain di Rumah Web dan arahkan ke VPS

**Domain** adalah nama alamat website, misalnya `tokokamu.com`. Tanpa domain, orang harus memakai
alamat IP (`103.150.10.20`), dan backend tidak bisa memakai HTTPS dengan mudah.

**DNS** (Domain Name System) adalah "buku alamat" internet. DNS menerjemahkan nama domain menjadi
alamat server. Isi buku alamat itu disebut **record**:

| Record | Fungsi | Contoh |
| --- | --- | --- |
| **A** | Nama → alamat IP | `api.tokokamu.com` → `103.150.10.20` |
| **CNAME** | Nama → nama lain | `www.tokokamu.com` → `abc123.vercel-dns-017.com` |

**Subdomain** adalah nama di depan domain, misalnya `api` dan `www`. Satu domain bisa punya
banyak subdomain, dan setiap subdomain bisa mengarah ke server yang berbeda.

## Rencana alamat

Panduan ini memakai `domainkamu.com` sebagai contoh. Ganti dengan domain kamu.

| Alamat | Isi | Mengarah ke | Diatur di |
| --- | --- | --- | --- |
| `api.domainkamu.com` | Backend (Express + MySQL) | IP VPS | Panduan ini, langkah 4 |
| `domainkamu.com` | Frontend (React) | Vercel | [Panduan Vercel](DEPLOY-VERCEL.md) |
| `www.domainkamu.com` | Frontend (React) | Vercel | [Panduan Vercel](DEPLOY-VERCEL.md) |

Urutan lengkap: **beli domain (panduan ini) → [deploy backend ke VPS](DEPLOY-VPS.md) →
[deploy frontend ke Vercel](DEPLOY-VERCEL.md)**.

## 1. Pilih nama dan ekstensi

**Ekstensi** adalah bagian akhir domain (`.com`, `.id`, `.my.id`). Harga di Rumah Web per
Oktober 2026 (cek lagi di rumahweb.com sebelum membeli):

| Ekstensi | Tahun pertama | Perpanjangan per tahun | Dokumen | Cocok untuk |
| --- | --- | --- | --- | --- |
| `.my.id` | Rp 9.900 (promo) | Rp 25.000 | Tidak perlu | Belajar, portofolio pribadi |
| `.web.id` | Rp 50.000 | Rp 50.000 | Tidak perlu | Website pribadi |
| `.com` | Rp 137.000 (promo) | Rp 219.000 | Tidak perlu | Bisnis, internasional |
| `.id` | Rp 219.000 | Rp 219.000 | Tidak perlu | Bisnis di Indonesia |
| `.co.id` | Rp 300.000 | Rp 300.000 | KTP dan NIB | Perusahaan di Indonesia |

Perhatikan **harga perpanjangan**, bukan hanya harga tahun pertama. Domain harus diperpanjang
setiap tahun.

Tips memilih nama:

- Pendek, mudah dieja, dan mudah diucapkan.
- Hindari tanda hubung (`-`) dan angka jika bisa.
- Jangan memakai merek orang lain.

## 2. Beli domain

1. Buka https://www.rumahweb.com, lalu buka halaman **Domain**.
2. Ketik nama domain di kolom pencarian, lalu cari. Rumah Web menampilkan ekstensi yang masih
   tersedia.
3. Pilih domain, lalu lanjutkan ke checkout. Kamu tidak perlu membeli hosting. Backend ada di
   VPS dan frontend ada di Vercel.
4. Login ke akun Rumah Web (akun yang sama dengan VPS), atau buat akun baru.
5. Isi **data pemilik domain** dengan data asli. Pemilik yang tercatat adalah pemilik domain
   secara hukum.
6. Bayar, lalu tunggu email bahwa domain sudah aktif.

**Penting setelah membeli:**

- **Verifikasi email.** Untuk ekstensi internasional (misalnya `.com`), kamu menerima email
  verifikasi data pemilik. Klik link di email itu. Jika tidak diverifikasi dalam 15 hari, domain
  bisa dinonaktifkan.
- **Catat tanggal kedaluwarsa.** Jika domain tidak diperpanjang, website dan API berhenti
  bekerja. Menebus domain yang sudah lewat masa tenggang jauh lebih mahal (untuk `.com`:
  Rp 1.800.000). Pasang pengingat di kalender sebulan sebelum tanggal itu.

## 3. Buka DNS Management

1. Login ke **Clientzone** Rumah Web.
2. Buka menu **Domain**, lalu klik **Manage** pada domain kamu.
3. Klik **DNS Management**.
4. Jika muncul tombol seperti **Daftar**, **Aktifkan**, atau **Ubah Nameserver**, klik tombol itu
   sampai tidak ada lagi tombol update. Ini mengaktifkan DNS Management Rumah Web.

Jika domain kamu memakai nameserver lain (misalnya Cloudflare), tambahkan record di panel DNS
penyedia itu, bukan di Clientzone.

## 4. Arahkan `api` ke IP VPS

Di **DNS Management**, klik **Add New Record**, lalu isi:

| Kolom | Isi |
| --- | --- |
| Nama / Host | `api` |
| Type | `A` |
| Record / Value | IP VPS kamu, misalnya `103.150.10.20` |
| TTL | Biarkan default |

Simpan. Record untuk `domainkamu.com` dan `www` (frontend) dibuat nanti di
[panduan Vercel](DEPLOY-VERCEL.md), karena nilainya diberikan oleh Vercel.

## 5. Cek record sudah aktif

Perubahan DNS butuh waktu untuk menyebar ke seluruh internet. Biasanya beberapa menit, paling
lama sekitar 24 jam.

Dari terminal laptop (Windows, macOS, atau Linux):

```bash
nslookup api.domainkamu.com
```

Hasil yang benar menampilkan IP VPS kamu di bagian `Address`. Kamu juga bisa mengecek dari
banyak negara sekaligus di https://dnschecker.org.

**Jangan lanjut ke langkah HTTPS di panduan VPS sebelum record ini aktif.** Caddy hanya bisa
membuat sertifikat HTTPS jika `api.domainkamu.com` sudah mengarah ke VPS.

## Troubleshooting

| Gejala | Penyebab umum | Cara cek dan perbaiki |
| --- | --- | --- |
| `nslookup` menjawab `can't find` atau `NXDOMAIN` | Record belum dibuat, atau belum menyebar | Cek record di DNS Management. Tunggu, lalu coba lagi. |
| `nslookup` menampilkan IP lain | Ada record lama untuk nama yang sama, atau IP salah ketik | Hapus record lama. Perbaiki IP. |
| Perubahan record tidak berpengaruh | Nameserver domain bukan milik Rumah Web | Cek **Nameserver Setting** di Clientzone. |
| Domain tidak aktif setelah beberapa hari | Email verifikasi pemilik belum diklik | Cari email verifikasi (cek folder spam), lalu klik link-nya. |
