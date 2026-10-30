import 'dotenv/config';

// Nilai contoh dari .env.example. Production wajib memakai secret acak sendiri.
const EXAMPLE_SECRET = 'ganti-dengan-secret-lokal-yang-panjang';

export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1d';

// Dipanggil saat server start, agar konfigurasi salah langsung terlihat di log,
// bukan baru muncul sebagai error 500 ketika pengguna login.
export function assertAuthConfig() {
  if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET wajib diatur, minimal 32 karakter.');
  }
  if (process.env.NODE_ENV === 'production' && JWT_SECRET === EXAMPLE_SECRET) {
    throw new Error('JWT_SECRET production tidak boleh memakai nilai dari .env.example.');
  }
}

export function getJwtSecret() {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET belum diatur di .env.');
  }
  return JWT_SECRET;
}
