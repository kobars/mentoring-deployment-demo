import { validationResult } from 'express-validator';
// SELESAI B1
export function validateRequest(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array({ onlyFirstError: true })
      .map(error => ({ field: error.path, message: error.msg }));
    return res.status(400).json({
      success: false, message: 'Validasi gagal.', errors
    });
  }
  next();
}
