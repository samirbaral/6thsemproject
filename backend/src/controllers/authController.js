import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { sign as signJwt } from '../lib/jwt.js';

// Helpers
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'));
}

export async function register(req, res, next) {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const validRoles = ['ADMIN', 'OWNER', 'TENANT'];
    const userRole = role && validRoles.includes(role.toUpperCase()) ? role.toUpperCase() : 'TENANT';

    // Only allow ADMIN role to be created by existing admins (enforced in middleware)
    if (userRole === 'ADMIN' && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can create admin users' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already in use' });

    const passwordHash = hashPassword(password);
    const userData = {
      email,
      password: passwordHash,
      name,
      role: userRole,
      ownerStatus: userRole === 'OWNER' ? 'PENDING' : null,
      updatedAt: new Date(),
    };

    const user = await prisma.user.create({ data: userData });

    const token = signJwt({ sub: user.id, email: user.email, role: user.role });

    // Set JWT as httpOnly cookie
    // Use SameSite=None and Secure so the browser accepts cross-origin cookies (frontend on different port)
    // Note: in production ensure HTTPS so Secure cookies are sent safely.
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };
    res.cookie('token', token, cookieOptions);

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        ownerStatus: user.ownerStatus,
      },
    });
  } catch (err) {
    console.error('[authController] register error', err);
    return next(err);
  }
}

export async function signin(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = verifyPassword(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = signJwt({ sub: user.id, email: user.email, role: user.role });

    // Set JWT as httpOnly cookie
    // Use SameSite=None and Secure so the browser accepts cross-origin cookies (frontend on different port)
    // Note: in production ensure HTTPS so Secure cookies are sent safely.
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    res.cookie('token', token, cookieOptions);

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        ownerStatus: user.ownerStatus,
      },
    });
  } catch (err) {
    console.error('[authController] signin error', err);
    return next(err);
  }
}

export async function signout(_req, res) {
  // Clear the cookie (works even if not present)
  // Ensure we clear using the same attributes so the cookie is removed properly
  const cookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 0,
  };
  res.clearCookie('token', cookieOptions);
  return res.status(200).json({ message: 'Signed out' });
}
