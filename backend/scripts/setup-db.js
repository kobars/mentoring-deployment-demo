import { readFile } from 'node:fs/promises';
import { db } from '../db/connection.js';

try {
  const sql = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
  const statements = sql.replace(/^--.*$/gm, '').split(';').map(s => s.trim()).filter(Boolean);
  for (const statement of statements) await db.query(statement);
  console.log('Tabel produk dan users siap.');
} finally {
  await db.end();
}
