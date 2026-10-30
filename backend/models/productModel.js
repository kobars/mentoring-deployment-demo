// Semua query Product berada di Model MySQL dan menggunakan parameter SQL.
import { db } from '../db/connection.js';

export async function getAllProducts() {
  const [rows] = await db.execute(
    'SELECT id, name, price, description FROM products ORDER BY id'
  );
  return rows;
}

export async function createProduct({ name, price, description }) {
  const [result] = await db.execute(
    'INSERT INTO products (name, price, description) VALUES (?, ?, ?)',
    [name, price, description]
  );
  return findProductById(result.insertId);
}

// Filter dikerjakan oleh SQL, bukan Array.filter() di JavaScript.
// Parameter tetap dipisahkan dari query agar input tidak digabung ke string SQL.
export async function searchProducts(name) {
  const [rows] = await db.execute(
    'SELECT id, name, price, description FROM products WHERE name LIKE ? ORDER BY id',
    [`%${name}%`]
  );
  return rows;
}

export async function findProductById(id) {
  const [rows] = await db.execute(
    'SELECT id, name, price, description FROM products WHERE id = ?',
    [id]
  );
  return rows[0] ?? null;
}

// Setelah UPDATE, baca kembali row berdasarkan ID. Jangan memakai changedRows untuk 404:
// mengirim nilai yang sama tetap berarti record tersebut ada.
export async function updateProduct(id, { name, price, description }) {
  await db.execute(
    'UPDATE products SET name = ?, price = ?, description = ? WHERE id = ?',
    [name, price, description, id]
  );
  return findProductById(id);
}

export async function updateProductPrice(id, price) {
  await db.execute(
    'UPDATE products SET price = ? WHERE id = ?',
    [price, id]
  );
  return findProductById(id);
}

export async function deleteProduct(id) {
  const [result] = await db.execute(
    'DELETE FROM products WHERE id = ?',
    [id]
  );
  return result.affectedRows > 0;
}
