import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'change_me_in_production';
const EXPIRES_IN = '7d';

export function sign(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

export function verify(token) {
  return jwt.verify(token, SECRET);
}