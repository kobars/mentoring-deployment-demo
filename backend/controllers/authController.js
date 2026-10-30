import bcrypt from 'bcryptjs';
import { createUser, findUserByEmail } from '../models/userModel.js';
import { issueToken } from '../auth/tokenService.js';
import { HttpError } from '../utils/HttpError.js';

const DUMMY_HASH = '$2b$10$7EqJtq98hPqEX7fNZaFWoO7wK6DcuO7mEkv6JwHI0pZ62p64JI8e.';

export async function register(req, res) {
  const { name, email, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await createUser({ name, email, passwordHash });
  if (!user) throw new HttpError(409, 'Email sudah digunakan.', [
    { field: 'email', message: 'Gunakan email lain atau login.' }
  ]);
  res.status(201).json({ success: true, data: { user: { id: user.id, name: user.name, email: user.email } } });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);
  const valid = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !valid) throw new HttpError(401, 'Email atau password salah.');
  const token = issueToken(user.id);
  res.json({ success: true, data: {
    token,
    tokenType: 'Bearer',
    user: { id: user.id, name: user.name, email: user.email }
  } });
}
