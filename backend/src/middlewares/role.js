import {prisma} from '../lib/prisma.js';

export function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { role: true, ownerStatus: true },
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // For owners, check if they're approved
      if (user.role === 'OWNER' && user.ownerStatus !== 'APPROVED') {
        return res.status(403).json({ error: 'Owner account not approved yet' });
      }

      req.user.role = user.role;
      next();
    } catch (err) {
      console.error('[role] error', err);
      return next(err);
    }
  };
}
