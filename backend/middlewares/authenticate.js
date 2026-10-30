import { verifyToken } from '../auth/tokenService.js';
import { HttpError } from '../utils/HttpError.js';

export function authenticate(req, res, next) {
  const match = /^Bearer (\S+)$/i.exec(req.get('Authorization') ?? '');
  const claims = match ? verifyToken(match[1]) : null;
  if (!claims) {
    return next(new HttpError(401, 'Silakan login dengan token yang valid.'));
  }
  req.auth = claims;
  next();
}
