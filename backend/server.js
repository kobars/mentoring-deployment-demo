// Entry point: menjalankan server. Dipakai oleh `npm start` dan container Docker.
import app from './app.js';
import { db, assertDbConfig } from './db/connection.js';
import { assertAuthConfig } from './config/auth.js';

// Gagal di awal jika .env belum lengkap.
assertAuthConfig();
assertDbConfig();

const port = Number(process.env.PORT ?? 3000);
// Tanpa host: menerima koneksi dari semua alamat. Wajib di Docker, karena Caddy ada di container lain.
const server = app.listen(port, () => {
  console.log(`Server berjalan di port ${port} (${process.env.NODE_ENV ?? 'development'})`);
});

// Docker mengirim SIGTERM saat container dihentikan. Selesaikan request aktif, lalu tutup database.
const shutdown = signal => {
  console.log(`${signal} diterima. Menutup server...`);
  server.close(async () => {
    await db.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
