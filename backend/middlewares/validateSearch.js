// SUDAH DISEDIAKAN. Filter nama tetap menerima string kosong.
export function validateSearch(req, res, next) {
  if (req.query.name !== undefined && typeof req.query.name !== 'string') {
    return res.status(400).json({ success: false, message: 'Validasi gagal.',
      errors: [{ field: 'name', message: 'Query name wajib berupa teks tunggal.' }] });
  }
  next();
}
