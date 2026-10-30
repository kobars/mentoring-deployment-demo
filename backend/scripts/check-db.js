import { db } from '../db/connection.js';

try {
  const [server] = await db.execute('SELECT DATABASE() AS database_name, VERSION() AS version');
  const [products] = await db.execute('SELECT id, name, price FROM products ORDER BY id');
  const [users] = await db.execute('SELECT id, name, email FROM users ORDER BY id');
  console.table(server);
  console.table(products);
  console.table(users);
} finally {
  await db.end();
}
