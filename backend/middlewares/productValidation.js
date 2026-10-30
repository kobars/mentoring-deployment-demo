// Import dan fungsi penggabung sudah tersedia. Isi A1, A2, dan A3.
import { body, param } from 'express-validator';
// SELESAI A1
export const nameRules = () => body('name')
  .isString().withMessage('Nama wajib berupa teks.').bail()
  .trim()
  .notEmpty().withMessage('Nama wajib diisi.').bail()
  .isLength({ min: 3, max: 100 })
  .withMessage('Nama harus 3 sampai 100 karakter.');

// SELESAI A2
export const priceRules = () => body('price')
  .custom(value => typeof value === 'number' && Number.isFinite(value))
  .withMessage('Harga wajib berupa angka JSON.').bail()
  .isFloat({ min: 0 })
  .withMessage('Harga minimal 0.');

// SELESAI A3
export const descriptionRules = () => body('description')
  .isString().withMessage('Deskripsi wajib berupa teks.').bail()
  .isLength({ max: 1000 })
  .withMessage('Deskripsi maksimal 1000 karakter.');

// SUDAH DISEDIAKAN. POST/PUT menerima tiga field. PATCH hanya mengganti harga.
const objectRule = () => body().custom(value =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
).withMessage('Body harus berupa object JSON.');

export const validateProduct = () => [
  objectRule(), nameRules(), priceRules(), descriptionRules()
];

export const validatePricePatch = () => [
  objectRule(), priceRules(),
  body().custom(value => value && Object.keys(value).every(key => key === 'price'))
    .withMessage('PATCH pada API ini hanya menerima field price.')
];

// SUDAH DISEDIAKAN. abc, 0, -1, 1.5, dan angka terlalu besar bukan ID valid.
export const validateId = param('id')
  .custom(value => /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value)))
  .withMessage('ID harus berupa bilangan bulat positif.');
