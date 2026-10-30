// Semua query user berada pada Model MySQL.
import { db } from '../db/connection.js';

export async function findUserByEmail(email) {
  const [rows] = await db.execute(
    'SELECT id, name, email, password_hash FROM users WHERE email = ?',
    [email]
  );
  return rows[0] ?? null;
}

export async function findUserById(id) {
  const [rows] = await db.execute(
    'SELECT id, name, email FROM users WHERE id = ?',
    [id]
  );
  return rows[0] ?? null;
}

export async function createUser({ name, email, passwordHash }) {
  try {
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );
    return findUserById(result.insertId);
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY' || error?.errno === 1062) return null;
    throw error;
  }
}
