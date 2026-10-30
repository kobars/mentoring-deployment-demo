// Smoke test: menguji alur API lengkap pada server yang sudah berjalan.
// Pemakaian: npm run smoke -- http://IP_VPS  atau  npm run smoke -- https://nama-app.vercel.app
// Hanya memakai path /api/..., jadi bisa dipakai langsung ke VPS maupun lewat Vercel.
// Script membuat satu akun test baru dan satu produk, lalu menghapus produk tersebut.
const baseUrl = (process.argv[2] ?? 'http://localhost:3000').replace(/\/+$/, '');
let token = '';
let failed = 0;

async function call(method, path, body) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(baseUrl + path, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await response.text();
  return { status: response.status, data: text ? JSON.parse(text) : null };
}

async function step(label, expected, run) {
  try {
    const { status, data } = await run();
    const ok = status === expected;
    if (!ok) failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label} → ${status}${ok ? '' : ` (harusnya ${expected})`}`);
    return data;
  } catch (error) {
    failed++;
    console.log(`FAIL  ${label} → ${error.cause?.code ?? error.message}`);
    return null;
  }
}

console.log(`Smoke test: ${baseUrl}\n`);
const email = `smoke-${Date.now()}@example.com`;
const password = 'smoke-test-password';

await step('GET /api/products tanpa token', 401, () => call('GET', '/api/products'));
await step('POST /api/auth/register', 201, () => call('POST', '/api/auth/register', { name: 'Smoke Test', email, password }));
const login = await step('POST /api/auth/login', 200, () => call('POST', '/api/auth/login', { email, password }));
token = login?.data?.token ?? '';

const created = await step('POST /api/products', 201, () =>
  call('POST', '/api/products', { name: 'Produk Smoke Test', price: 1000, description: 'Dibuat oleh smoke test' }));
const id = created?.data?.id;
if (id) {
  await step(`GET /api/products/${id}`, 200, () => call('GET', `/api/products/${id}`));
  await step(`PATCH /api/products/${id}`, 200, () => call('PATCH', `/api/products/${id}`, { price: 2000 }));
  await step(`DELETE /api/products/${id}`, 204, () => call('DELETE', `/api/products/${id}`));
  await step(`GET /api/products/${id} setelah delete`, 404, () => call('GET', `/api/products/${id}`));
}

console.log(failed ? `\n${failed} langkah gagal.` : '\nSemua langkah berhasil.');
process.exit(failed ? 1 : 0);
