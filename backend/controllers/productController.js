// CRUD Product sudah tersedia. GET detail sudah disediakan.
import { createProduct, searchProducts, findProductById,
  updateProduct, updateProductPrice, deleteProduct } from '../models/productModel.js';
import { HttpError } from '../utils/HttpError.js';

export async function index(req, res) {
  res.status(200).json({ data: await searchProducts(req.query.name ?? '') });
}
export async function store(req, res) {
  res.status(201).json({ data: await createProduct(req.body) });
}
export async function show(req, res, next) {
  const product = await findProductById(Number(req.params.id));
  if (!product) return missing(req, res, next);
  res.json({ data: product });
}
export async function replace(req, res, next) {
  const product = await updateProduct(Number(req.params.id), req.body);
  if (!product) return missing(req, res, next);
  res.json({ data: product });
}
export async function patchPrice(req, res, next) {
  const product = await updateProductPrice(Number(req.params.id), req.body.price);
  if (!product) return missing(req, res, next);
  res.json({ data: product });
}
export async function destroy(req, res, next) {
  const deleted = await deleteProduct(Number(req.params.id));
  if (!deleted) return missing(req, res, next);
  res.status(204).end();
}

// SELESAI C. Error 404 diteruskan ke global error handler.
function missing(req, res, next) {
  return next(new HttpError(404, 'Produk tidak ditemukan.'));
}
