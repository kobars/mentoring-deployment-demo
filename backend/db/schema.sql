-- Tabel Product.
CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL
);

-- Data contoh hanya diisi saat tabel masih kosong.
INSERT INTO products (name, price, description)
SELECT 'Buku Tulis', 12000, '40 halaman' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM products);
INSERT INTO products (name, price, description)
SELECT 'Pensil', 3000, 'Pensil HB' FROM DUAL WHERE (SELECT COUNT(*) FROM products) = 1;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL
);
