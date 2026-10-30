// SUDAH DISEDIAKAN. Memakai pola validasi dan error per field dari Day 46.
import { body } from 'express-validator';
import bcrypt from 'bcryptjs';

const name = () => body('name').isString().withMessage('Nama wajib berupa teks.').bail()
  .trim().isLength({ min: 3, max: 100 }).withMessage('Nama harus 3 sampai 100 karakter.');
const email = () => body('email').isString().withMessage('Email wajib berupa teks.').bail()
  .trim().isLength({ max: 254 }).withMessage('Email terlalu panjang.').bail()
  .isEmail().withMessage('Format email tidak valid.').bail().toLowerCase();
const password = () => body('password').isString().withMessage('Password wajib berupa teks.').bail()
  .isLength({ min: 8 }).withMessage('Password minimal 8 karakter.').bail()
  .custom(value => !bcrypt.truncates(value)).withMessage('Password maksimal 72 byte UTF-8.');

export const validateRegister = () => [name(), email(), password()];
export const validateLogin = () => [email(), password()];
// Password tidak di-trim. Spasi menjadi bagian password yang dipilih pengguna.
