// SUDAH DISEDIAKAN — elemen View yang dipakai latihan.
const form = document.querySelector('#product-form');
const list = document.querySelector('#product-list');
const status = document.querySelector('#status');
const loadButton = document.querySelector('#load-products');

// SUDAH DISEDIAKAN — DOM memakai textContent untuk data produk.
function renderProducts(products) {
  list.replaceChildren();
  document.querySelector('#product-count').textContent = products.length;
  if (products.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'Belum ada produk yang cocok. Coba nama lain atau tambah produk baru.';
    list.append(empty);
  }
  products.forEach(product => {
    const card = document.querySelector('#product-card').content.cloneNode(true);
    card.querySelector('.product-id').textContent = `PRODUK #${product.id}`;
    card.querySelector('.product-name').textContent = product.name;
    card.querySelector('.product-description').textContent = product.description || 'Belum ada deskripsi.';
    card.querySelector('.product-price').textContent = new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', maximumFractionDigits: 0
    }).format(product.price);
    card.querySelector('.edit-button').addEventListener('click', () => openEdit(product));
    card.querySelector('.price-button').addEventListener('click', () => openPrice(product));
    card.querySelector('.delete-button').addEventListener('click', () => openDelete(product));
    list.append(card);
  });
}



// SUDAH DISEDIAKAN. Token hanya ada di memori halaman, login ulang setelah reload.
let token = '';

async function request(path, method = 'GET', body) {
  const headers = authHeaders(body);
  const response = await fetch(path, { method, headers,
    body: body === undefined ? undefined : JSON.stringify(body) });
  const content = await response.text();
  let result;
  try { result = content ? JSON.parse(content) : {}; }
  catch { result = { message: 'Response server tidak dapat dibaca.' }; }
  if (response.status === 401 && !path.startsWith('/api/auth/login')) clearSession();
  if (!response.ok) {
    const error = new Error(result.message ?? `Request gagal (${response.status}).`);
    error.errors = result.errors ?? [];
    error.status = response.status;
    throw error;
  }
  return { result, statusCode: response.status };
}

async function loadProducts() {
  const query = new URLSearchParams({ name: document.querySelector('#search-name').value });
  const { result } = await request(`/api/products?${query}`);
  renderProducts(result.data);
  status.textContent = `GET 200: ${result.data.length} produk`;
}

function clearFieldErrors(sourceForm) {
  sourceForm.querySelectorAll('[data-error]').forEach(hint => hint.textContent = '');
  sourceForm.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
  sourceForm.querySelector('.form-feedback').textContent = '';
}

// SELESAI DAY 46: error per field tetap digunakan.
function showFieldErrors(sourceForm, errors = []) {
  for (const error of errors) {
    const field = sourceForm.elements.namedItem(error.field);
    const hint = sourceForm.querySelector(`[data-error="${error.field}"]`);
    if (!field || !hint) continue;
    field.setAttribute('aria-invalid', 'true');
    hint.textContent = error.message;
  }
}

// SUDAH DISEDIAKAN. Jangan hapus input atau tutup dialog jika request gagal.
async function submitAction(sourceForm, operation, success) {
  clearFieldErrors(sourceForm);
  const button = sourceForm.querySelector('[type="submit"]');
  button.disabled = true;
  try {
    await operation();
    await loadProducts();
    success();
  } catch (error) {
    status.textContent = error.message;
    sourceForm.querySelector('.form-feedback').textContent = error.message;
    showFieldErrors(sourceForm, error.errors);
  } finally {
    button.disabled = false;
  }
}

async function saveProduct(event) {
  event.preventDefault();
  await submitAction(form, () => request('/api/products','POST',readProduct(form)), () => {
    form.reset(); status.textContent = 'Produk baru tersimpan.';
  });
}
async function saveEdit(event) {
  event.preventDefault();
  const id = editForm.elements.id.value;
  await submitAction(editForm, () => request(`/api/products/${id}`,'PUT',readProduct(editForm)), () => {
    editDialog.close(); status.textContent = `Produk #${id} diperbarui.`;
  });
}
async function savePrice(event) {
  event.preventDefault();
  const id = priceForm.elements.id.value;
  const raw = priceForm.elements.price.value;
  await submitAction(priceForm, () => request(`/api/products/${id}`,'PATCH', {
    price: raw.trim() === '' ? '' : Number(raw)
  }), () => { priceDialog.close(); status.textContent = `Harga produk #${id} diperbarui.`; });
}
async function confirmDelete(event) {
  event.preventDefault();
  const id = deleteForm.elements.id.value;
  await submitAction(deleteForm, () => request(`/api/products/${id}`,'DELETE'), () => {
    deleteDialog.close(); status.textContent = `Produk #${id} dihapus.`;
  });
}

loadButton.addEventListener('click', () => loadProducts().catch(showNetworkError));
form.addEventListener('submit', saveProduct);

// SUDAH DISEDIAKAN — form, dialog, dan event; bukan latihan animasi.
const editDialog = document.querySelector('#edit-dialog');
const editForm = document.querySelector('#edit-form');
const priceDialog = document.querySelector('#price-dialog');
const priceForm = document.querySelector('#price-form');
const deleteDialog = document.querySelector('#delete-dialog');
const deleteForm = document.querySelector('#delete-form');

function readProduct(sourceForm) {
  return {
    name: sourceForm.elements.name.value,
    price: sourceForm.elements.price.value.trim() === '' ? '' : Number(sourceForm.elements.price.value),
    description: sourceForm.elements.description.value
  };
}

function openEdit(product) {
  editForm.elements.id.value = product.id;
  editForm.elements.name.value = product.name;
  editForm.elements.price.value = product.price;
  editForm.elements.description.value = product.description;
  clearFieldErrors(editForm);
  editDialog.showModal();
}

function openPrice(product) {
  priceForm.elements.id.value = product.id;
  priceForm.elements.price.value = product.price;
  document.querySelector('#price-product-name').textContent = product.name;
  clearFieldErrors(priceForm);
  priceDialog.showModal();
}

function openDelete(product) {
  deleteForm.elements.id.value = product.id;
  document.querySelector('#delete-product-name').textContent = product.name;
  clearFieldErrors(deleteForm);
  deleteDialog.showModal();
}

// JavaScript mengatur data dan dialog. Semua gerak ada di style.css.
document.querySelectorAll('[data-close]').forEach(button => {
  button.addEventListener('click', () => button.closest('dialog').close());
});
editForm.addEventListener('submit', saveEdit);
priceForm.addEventListener('submit', savePrice);
deleteForm.addEventListener('submit', confirmDelete);
document.querySelector('#search-name').addEventListener('keydown', event => {
  if (event.key === 'Enter') { event.preventDefault(); loadProducts().catch(showNetworkError); }
});

// SUDAH DISEDIAKAN. Semua tempat pesan sudah ada, siswa hanya mengisi fungsi E.
document.querySelectorAll('form.stack-form').forEach(sourceForm => {
  for (const name of ['name','price','description','email','password']) {
    const field = sourceForm.elements.namedItem(name);
    if (!field) continue;
    const hint = document.createElement('span');
    hint.className = 'field-error'; hint.dataset.error = name;
    hint.id = `${sourceForm.id}-${name}-error`;
    field.setAttribute('aria-describedby', hint.id);
    field.after(hint);
  }
  const feedback = document.createElement('p');
  feedback.className = 'form-feedback'; feedback.setAttribute('role','alert');
  sourceForm.append(feedback);
});

function showNetworkError(error) { status.textContent = error.message; }

// LATIHAN D1 MULAI
async function startSession(data) {
  token = data.token;
  document.querySelector('#session-status').textContent = `Masuk sebagai ${data.user.name}.`;
  document.querySelector('#logout').hidden = false;
  document.querySelectorAll('dialog.auth-dialog').forEach(dialog => dialog.close());
  await loadProducts();
}
// LATIHAN D1 SELESAI

// LATIHAN D2 MULAI
function authHeaders(body) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return headers;
}
// LATIHAN D2 SELESAI

// SUDAH DISEDIAKAN. Form, event, validasi dan logout.
const loginForm = document.querySelector('#login-form');
const registerForm = document.querySelector('#register-form');
document.querySelector('#open-login').addEventListener('click', () => {
  clearFieldErrors(loginForm); document.querySelector('#login-dialog').showModal();
});
document.querySelector('#open-register').addEventListener('click', () => {
  clearFieldErrors(registerForm); document.querySelector('#register-dialog').showModal();
});

function clearSession() {
  token = '';
  document.querySelector('#logout').hidden = true;
  document.querySelector('#session-status').textContent = 'Masuk untuk membuka dan mengelola koleksi.';
  list.replaceChildren();
  document.querySelector('#product-count').textContent = '0';
  const message = document.createElement('p');
  message.className = 'locked-state'; message.textContent = 'Koleksi tersedia setelah kamu masuk.';
  list.append(message);
}

async function submitCredentials(sourceForm, operation) {
  clearFieldErrors(sourceForm);
  const button = sourceForm.querySelector('[type="submit"]'); button.disabled = true;
  try { await operation(); }
  catch (error) {
    sourceForm.querySelector('.form-feedback').textContent = error.message;
    showFieldErrors(sourceForm, error.errors);
  } finally { button.disabled = false; }
}

registerForm.addEventListener('submit', async event => {
  event.preventDefault();
  await submitCredentials(registerForm, async () => {
    const body = Object.fromEntries(new FormData(registerForm));
    const { result } = await request('/api/auth/register', 'POST', body);
    loginForm.elements.email.value = result.data.user.email;
    registerForm.reset(); document.querySelector('#register-dialog').close();
    clearFieldErrors(loginForm); document.querySelector('#login-dialog').showModal();
    loginForm.querySelector('.form-feedback').textContent = 'Akun berhasil dibuat. Masuk dengan password pilihanmu.';
  });
});

loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  await submitCredentials(loginForm, async () => {
    const body = Object.fromEntries(new FormData(loginForm));
    const { result } = await request('/api/auth/login', 'POST', body);
    await startSession(result.data);
    loginForm.elements.password.value = '';
    status.textContent = 'Kamu sudah masuk. Koleksi siap dikelola.';
  });
});

document.querySelector('#logout').addEventListener('click', () => {
  clearSession();
  status.textContent = 'Login untuk membuka koleksi.';
});

clearSession();
status.textContent = 'Daftar akun baru atau masuk untuk membuka koleksi.';
