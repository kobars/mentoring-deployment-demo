# Deploy frontend React ke Vercel (dengan domain sendiri)

Panduan ini untuk **frontend React kamu sendiri** (misalnya dibuat dengan Vite), dan siap untuk
production. Frontend demo di repo ini (folder `frontend/`) adalah HTML biasa tanpa build, tetapi
langkahnya sama.

**Vercel** adalah layanan hosting. Di sini, Vercel hanya menyimpan file frontend dan
mengirimkannya ke browser. Backend dan database tetap berjalan di VPS.

```text
Browser ──► https://domainkamu.com            (Vercel: file frontend)
        └─► https://domainkamu.com/api/...    (Vercel meneruskan ke https://api.domainkamu.com/api/...)
```

**Sebelum mulai:** selesaikan [beli domain](BELI-DOMAIN.md) dan [deploy backend ke VPS](DEPLOY-VPS.md).
`https://api.domainkamu.com` harus sudah menjawab dengan HTTPS.

## Cara kerjanya

File `vercel.json` di folder frontend berisi dua aturan **rewrite**. Rewrite artinya Vercel
mengambil isi dari alamat lain, tetapi browser tetap melihat alamat Vercel.

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://api.domainkamu.com/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

1. Request ke `/api/...` diteruskan ke backend di VPS.
2. Alamat lain yang bukan file (misalnya `/products/3` dari React Router) dijawab dengan
   `index.html`. Tanpa aturan ini, refresh di halaman selain `/` menghasilkan **404**.

Urutannya penting: aturan `/api` harus di atas.

**Kenapa memakai rewrite, bukan memanggil `https://api.domainkamu.com` langsung dari browser?**
Frontend dan API jadi berada di alamat yang sama. Karena itu:

- Backend tidak perlu pengaturan **CORS** (izin request dari domain lain).
- Frontend tidak perlu environment variable untuk alamat API.
- Cookie login (jika app kamu memakainya) bekerja tanpa pengaturan tambahan.

## 0. Siapkan frontend kamu (di laptop)

Lewati bagian ini jika kamu men-deploy demo dari repo ini.

### Panggil API dengan alamat relatif

Semua request ke backend harus memakai alamat yang diawali `/api`, **tanpa** `http://...`:

```js
// Benar
fetch('/api/products')
axios.create({ baseURL: '/api' })

// Salah
fetch('http://localhost:3000/api/products')
axios.create({ baseURL: 'https://api.domainkamu.com/api' })
```

Cari alamat yang salah dengan fitur search di editor: kata kunci `localhost:` dan `http` di
folder `src/`. Jika kamu memakai `import.meta.env.VITE_API_URL`, ganti dengan `'/api'`.

### Agar alamat relatif tetap berjalan di laptop

Saat development, Vite berjalan di port 5173 dan backend di port lain. Tambahkan **proxy** di
`vite.config.js`, agar `npm run dev` meneruskan `/api` ke backend lokal:

```js
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:3000' }, // port backend lokal kamu
  },
})
```

### Salin `vercel.json`

Salin `frontend/vercel.json` dari repo demo ke **folder frontend kamu**, di sebelah
`package.json` (bukan di dalam `src/` atau `public/`).

### Backend tanpa awalan `/api`

Jika route backend kamu tidak diawali `/api` (misalnya `/products` dan `/login`), frontend tetap
memanggil `/api/products`. Lalu ubah aturan pertama agar Vercel membuang awalan `/api`:

```json
{ "source": "/api/:path*", "destination": "https://api.domainkamu.com/:path*" }
```

Untuk development lokal, tambahkan `rewrite` pada proxy Vite:

```js
proxy: {
  '/api': { target: 'http://localhost:3000', rewrite: path => path.replace(/^\/api/, '') },
},
```

## 1. Isi domain API di `vercel.json`

Ganti `api.domainkamu.com` dengan subdomain API kamu. Contoh:

```json
{ "source": "/api/:path*", "destination": "https://api.tokokamu.com/api/:path*" }
```

Commit dan push perubahan ini ke GitHub.

## 2. Import project ke Vercel

1. Login ke https://vercel.com dengan akun GitHub.
2. Klik **Add New… → Project**, lalu **Import** repo kamu.
3. **Root Directory**: klik **Edit**, pilih folder frontend (di demo ini: **`frontend`**).
   Ini langkah terpenting. Jika frontend ada di repo sendiri, biarkan kosong.
4. **Framework Preset**: Vercel biasanya mendeteksinya sendiri.

   | Frontend | Framework Preset | Build Command | Output Directory |
   | --- | --- | --- | --- |
   | React + Vite | Vite | `npm run build` | `dist` |
   | Create React App | Create React App | `npm run build` | `build` |
   | Demo ini (HTML biasa) | Other | kosong | kosong |

5. **Environment Variables**: tidak perlu untuk alamat API. Alamat API ada di `vercel.json`.
6. Klik **Deploy**.

Setelah selesai, frontend bisa dibuka di alamat sementara dari Vercel, misalnya
`https://nama-app.vercel.app`. Cek dulu di alamat ini (langkah 4), lalu pasang domain.

## 3. Pasang domain sendiri

### Di Vercel

1. Buka project → **Settings** → **Domains** → **Add Domain**.
2. Ketik `domainkamu.com`, lalu tambahkan. Vercel menawarkan untuk menambahkan
   `www.domainkamu.com` juga, dengan redirect. Terima.
3. Vercel menampilkan record DNS yang harus dibuat, biasanya:
   - **A** record untuk `domainkamu.com`.
   - **CNAME** record untuk `www`.

   **Pakai nilai yang ditampilkan Vercel untuk project kamu.** Jangan menyalin nilai dari
   panduan atau project lain.

### Di Rumah Web (DNS Management)

1. Buka Clientzone → **Domain** → **Manage** → **DNS Management**
   (lihat [panduan beli domain](BELI-DOMAIN.md), langkah 3).
2. **Hapus record lama** untuk nama domain utama dan `www` (A atau CNAME), jika ada. Record lama
   membuat Vercel menampilkan **Invalid Configuration**. Jangan menghapus record `api`.
3. Klik **Add New Record**, lalu buat dua record dengan nilai dari Vercel:

   | Nama / Host | Type | Record / Value |
   | --- | --- | --- |
   | kosongkan (domain utama) | `A` | nilai A dari Vercel |
   | `www` | `CNAME` | nilai CNAME dari Vercel |

4. Kembali ke Vercel → **Settings** → **Domains**. Tunggu sampai kedua domain berstatus
   **Valid Configuration**. Biasanya beberapa menit, paling lama sekitar 24 jam.

Vercel memasang HTTPS untuk domain ini secara otomatis.

## 4. Cek hasil deploy

Lakukan di `https://nama-app.vercel.app` dulu, lalu di `https://domainkamu.com`:

1. Halaman frontend muncul, dengan ikon gembok (HTTPS).
2. Buka `/api/...` (salah satu route GET kamu) → harus muncul **JSON dari backend**. Artinya
   Vercel berhasil meneruskan request ke VPS. Untuk demo ini: `/api/products` menjawab
   `"Silakan login dengan token yang valid."` (status 401).
3. Buka halaman lain dari menu, lalu tekan **refresh**. Halaman tetap muncul, bukan 404.
4. Coba fitur utama: daftar, login, tambah data.
5. Buka `https://www.domainkamu.com` → harus pindah ke `https://domainkamu.com`.

Untuk demo ini, smoke test lengkap bisa dijalankan dari VPS:

```bash
cd /var/www/app
docker compose exec app npm run smoke -- https://domainkamu.com
```

Semua langkah harus `PASS`.

## 5. Deploy berikutnya

- `git push` ke branch `main` → Vercel men-deploy ulang frontend secara otomatis.
- Setiap branch lain dan pull request mendapat **Preview Deployment** (alamat `vercel.app`
  sendiri). Preview memakai backend production yang sama, jadi hati-hati saat mencoba fitur
  yang mengubah data.
- Jika deploy baru bermasalah: **Deployments** → pilih deploy lama yang berhasil →
  **Promote to Production** (atau **Instant Rollback**).
- Perubahan di backend tetap harus di-deploy ke VPS (lihat panduan VPS).

## Belum punya domain? (hanya untuk latihan)

Pakai `http://IP_VPS/api/:path*` di `vercel.json`, dan lewati langkah 3. Backend harus
berjalan dalam mode latihan (lihat panduan VPS, bagian "Belum punya domain?").
**Jangan pakai cara ini untuk aplikasi sungguhan:** data antara Vercel dan VPS tidak terenkripsi.

## Troubleshooting

Buka **DevTools** di browser (`F12`), tab **Console** dan **Network**, untuk melihat error.

| Gejala | Penyebab umum | Cara cek dan perbaiki |
| --- | --- | --- |
| Halaman Vercel 404 | Root Directory salah | Project → Settings → General → Root Directory, lalu Redeploy. |
| Build gagal di Vercel | Error di kode, atau Framework Preset salah | Baca log build di Vercel. Coba `npm run build` di laptop. |
| Domain: **Invalid Configuration** | Record DNS belum dibuat, nilainya salah, atau masih ada record lama | Bandingkan record di Rumah Web dengan nilai di Vercel. Hapus record lama untuk nama yang sama. |
| Refresh di halaman selain `/` → 404 | `vercel.json` tidak ada di folder frontend, atau aturan kedua hilang | Cek lokasi dan isi `vercel.json`. |
| Console: **CORS** atau **Mixed Content** | Frontend masih memanggil alamat lengkap (`http://...` atau `https://api...`) | Ganti dengan alamat relatif `/api/...`. |
| `/api/...` menjawab halaman HTML, bukan JSON | Aturan `/api` ada di bawah aturan `/(.*)` | Pindahkan aturan `/api` ke atas. |
| `/api/...` menjawab 404 atau 502 | Domain API salah, backend mati, atau awalan `/api` tidak cocok | Buka `https://api.domainkamu.com/api/...` langsung. Jika itu gagal, perbaiki backend dulu. |
| Masih memakai alamat lama | `vercel.json` belum di-push | Commit dan push, lalu tunggu deploy selesai. |
