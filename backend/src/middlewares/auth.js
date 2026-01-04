import { verify as verifyJwt } from '../lib/jwt.js';

export function requireAuth(req, res, next) {
  // First try Authorization header
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader) {
    const [scheme, t] = authHeader.split(' ');
    if (scheme === 'Bearer' && t) token = t;
  }

  // Fallback to cookie (if set)
  if (!token && req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) return res.status(401).json({ error: 'Authorization token missing' });

  try {
    const payload = verifyJwt(token);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}