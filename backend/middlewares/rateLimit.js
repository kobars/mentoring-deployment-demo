import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { HttpError } from '../utils/HttpError.js';

// Login/register dibatasi 20 percobaan per 15 menit untuk setiap email, untuk menahan
// tebak password (brute force). Dihitung per email, bukan per IP, karena semua request
// dari frontend Vercel datang dari IP Vercel. Counter disimpan di memori proses.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: req => {
    const email = req.body?.email;
    return typeof email === 'string' && email.trim()
      ? `email:${email.trim().toLowerCase()}`
      : `ip:${ipKeyGenerator(req.ip)}`;
  },
  handler: (req, res, next) => next(new HttpError(429, 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.'))
});
