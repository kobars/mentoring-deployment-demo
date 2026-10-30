// Koneksi MySQL untuk Product API.
import 'dotenv/config';
import mysql from 'mysql2/promise';

export const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  decimalNumbers: true,
  connectionLimit: 5,
  connectTimeout: 10_000
});

export function assertDbConfig() {
  const missing = ['DB_HOST', 'DB_USER', 'DB_NAME'].filter(name => !process.env[name]);
  if (missing.length) {
    throw new Error(`Konfigurasi database belum lengkap: ${missing.join(', ')}.`);
  }
}
