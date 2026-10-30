# 3. Deploy frontend ke Vercel

**Vercel** menyimpan file frontend dan mengirimkannya ke browser, dengan HTTPS otomatis.
Backend tetap di VPS.

`vercel.json` di folder frontend berisi dua aturan **rewrite** (Vercel mengambil isi dari alamat
lain, tetapi browser tetap melihat alamat Vercel):

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://api.domainkamu.com/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

1. `/api/...` diteruskan ke backend di VPS. Karena frontend dan API ada di alamat yang sama,
   backend tidak perlu CORS dan frontend tidak perlu environment variable untuk alamat API.
2. Alamat lain (misalnya `/products/3` dari React Router) dijawab dengan `index.html`. Tanpa
   aturan ini, refresh di halaman selain `/` menghasilkan **404**.

Aturan `/api` harus di atas.

**Yang dibutuhkan:** backend sudah berjalan di `https://api.domainkamu.com`
([panduan 2](2-deploy-backend-vps.md)).

## 1. Isi domain API di `vercel.json` (di laptop)

Ganti `api.domainkamu.com` dengan subdomain API kamu. Commit dan push.

## 2. Import project ke Vercel

1. Login ke https://vercel.com dengan akun GitHub.
2. **Add New… → Project** → **Import** repo kamu.
3. **Root Directory**: **Edit** → pilih folder frontend (demo: `frontend`). Jika frontend ada di
   repo sendiri, biarkan kosong.
4. **Framework Preset**: biasanya terdeteksi sendiri.

   | Frontend | Framework Preset | Build Command | Output Directory |
   | --- | --- | --- | --- |
   | React + Vite | Vite | `npm run build` | `dist` |
   | Create React App | Create React App | `npm run build` | `build` |
   | Demo (HTML biasa) | Other | kosong | kosong |

5. **Environment Variables**: tidak perlu.
6. Klik **Deploy**.

**Cek** di alamat sementara dari Vercel, misalnya `https://nama-app.vercel.app`:

- Halaman frontend muncul.
- `/api/...` (salah satu route GET kamu) menjawab **JSON dari backend**. Demo: `/api/products`
  menjawab `"Silakan login dengan token yang valid."`.
- Buka halaman lain, lalu tekan **refresh**: halaman tetap muncul.

## 3. Pasang domain

**Di Vercel:**

1. Project → **Settings** → **Domains** → **Add Domain**.
2. Ketik `domainkamu.com`. Terima tawaran untuk menambahkan `www.domainkamu.com` dengan redirect.
3. Vercel menampilkan record DNS: **A** untuk `domainkamu.com` dan **CNAME** untuk `www`.
   Pakai nilai yang ditampilkan untuk project kamu.

**Di Rumah Web** (Clientzone → **Domain** → **Manage** → **DNS Management**):

1. Hapus record A atau CNAME lama untuk domain utama dan `www`, jika ada. Jangan hapus `api`.
2. **Add New Record** dua kali:

   | Nama / Host | Type | Record / Value |
   | --- | --- | --- |
   | kosongkan (domain utama) | `A` | nilai A dari Vercel |
   | `www` | `CNAME` | nilai CNAME dari Vercel |

**Cek:** di Vercel → **Settings** → **Domains**, kedua domain berstatus **Valid Configuration**
(beberapa menit sampai sekitar 24 jam). Lalu ulangi pengecekan langkah 2 di
`https://domainkamu.com`. `https://www.domainkamu.com` harus pindah ke `https://domainkamu.com`.

Aplikasi demo: dari VPS, jalankan `docker compose exec app npm run smoke -- https://domainkamu.com`
(semua `PASS`).

Selesai. Untuk deploy ulang dan perawatan: [4. Setelah deploy](4-setelah-deploy.md).

## Belum punya domain? (hanya untuk latihan)

Pakai `http://IP_VPS/api/:path*` di `vercel.json` dan lewati langkah 3. Backend harus memakai
mode latihan dari panduan 2.

## Troubleshooting

Buka DevTools di browser (`F12`), tab **Console** dan **Network**.

| Gejala | Perbaiki |
| --- | --- |
| Halaman Vercel 404 | Root Directory salah: Settings → General → Root Directory, lalu Redeploy. |
| Build gagal | Baca log build di Vercel. Coba `npm run build` di laptop. |
| Refresh di halaman selain `/` → 404 | `vercel.json` harus ada di folder frontend, dengan dua aturan. |
| Console: **CORS** atau **Mixed Content** | Frontend masih memanggil alamat lengkap. Ganti dengan `/api/...` ([panduan 0](0-siapkan-aplikasi.md), langkah 5). |
| `/api/...` menjawab HTML, bukan JSON | Pindahkan aturan `/api` ke atas di `vercel.json`. |
| `/api/...` menjawab 404 atau 502 | Buka `https://api.domainkamu.com/api/...` langsung. Jika itu gagal, perbaiki backend dulu. |
| Domain: **Invalid Configuration** | Bandingkan record di Rumah Web dengan nilai di Vercel. Hapus record lama untuk nama yang sama. |
