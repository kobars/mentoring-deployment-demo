// Test tanpa database: semua request di sini ditolak sebelum query SQL berjalan.
// Jalankan: npm test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.JWT_SECRET = 'test-secret-yang-panjangnya-lebih-dari-32-karakter';
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '1'; // Port tertutup: /health/ready harus gagal dengan cepat.
process.env.DB_USER = 'test';
process.env.DB_NAME = 'test';

const { default: app } = await import('../app.js');
const { db } = await import('../db/connection.js');
let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  server.close();
  await db.end();
});

const call = (path, options) => fetch(baseUrl + path, options);
const json = body => ({
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
});

test('GET /health menjawab ok', async () => {
  const response = await call('/health');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('GET /health/ready menjawab 503 jika database mati', async () => {
  const response = await call('/health/ready');
  assert.equal(response.status, 503);
  assert.equal((await response.json()).database, 'unreachable');
});

test('header keamanan dari helmet terpasang', async () => {
  const response = await call('/health');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-powered-by'), null);
  assert.ok(response.headers.get('content-security-policy'));
  assert.doesNotMatch(response.headers.get('content-security-policy'), /upgrade-insecure-requests/);
});

test('halaman frontend dan Swagger dilayani backend', async () => {
  assert.equal((await call('/')).status, 200);
  assert.equal((await call('/api-docs/')).status, 200);
  const spec = await call('/api-docs/openapi.json');
  assert.equal(spec.status, 200);
  assert.ok((await spec.json()).paths['/products']);
});

test('response API tidak boleh di-cache (termasuk oleh CDN Vercel)', async () => {
  const response = await call('/api/products');
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('endpoint tidak dikenal menjawab 404 JSON', async () => {
  const response = await call('/api/tidak-ada');
  assert.equal(response.status, 404);
  assert.equal((await response.json()).success, false);
});

test('produk tanpa token menjawab 401', async () => {
  assert.equal((await call('/api/products')).status, 401);
});

test('produk dengan token rusak menjawab 401', async () => {
  const response = await call('/api/products', { headers: { Authorization: 'Bearer abc.def.ghi' } });
  assert.equal(response.status, 401);
});

test('register dengan body tidak valid menjawab 400 per field', async () => {
  const response = await call('/api/auth/register', json({ name: 'A', email: 'bukan-email', password: '123' }));
  assert.equal(response.status, 400);
  const fields = (await response.json()).errors.map(error => error.field);
  assert.deepEqual(fields.sort(), ['email', 'name', 'password']);
});

test('JSON rusak menjawab 400, bukan 500', async () => {
  const response = await call('/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"email":'
  });
  assert.equal(response.status, 400);
});

test('login dibatasi rate limit (429) per email', async () => {
  // Password pendek ditolak validasi (400) sebelum query database, tapi tetap dihitung rate limit.
  const attempt = email => call('/api/auth/login', json({ email, password: '123' }));
  let status;
  for (let i = 0; i < 25 && status !== 429; i++) {
    status = (await attempt('korban@example.com')).status;
  }
  assert.equal(status, 429);
  // Email lain tidak ikut terblokir, walaupun datang dari IP yang sama (misalnya IP Vercel).
  assert.notEqual((await attempt('orang-lain@example.com')).status, 429);
});
