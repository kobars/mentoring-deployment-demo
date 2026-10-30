import { HttpError } from '../utils/HttpError.js';
// SELESAI D
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  err = normalizeParserError(err); // Helper sudah tersedia.
  const known = err instanceof HttpError;
  // Detail lengkap hanya ditulis ke log server, tidak pernah dikirim ke client.
  if (!known) console.error('[server]', req.method, req.originalUrl, err);
  res.status(known ? err.statusCode : 500).json({
    success: false,
    message: known ? err.message : 'Terjadi kesalahan pada server.',
    errors: known ? err.errors : []
  });
}

// SUDAH DISEDIAKAN. Pesan parser mentah tidak diteruskan ke client.
function normalizeParserError(err) {
  if (err.type === 'entity.parse.failed') {
    return new HttpError(400, 'Body JSON tidak valid.');
  }
  if (err.type === 'entity.too.large') {
    return new HttpError(413, 'Body request terlalu besar.');
  }
  return err;
}
