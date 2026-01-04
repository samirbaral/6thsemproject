import { prisma } from '../lib/prisma.js';

export async function health(req, res) {
  try {
    // lightweight DB check
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ ok: true, db: true });
  } catch (err) {
    console.error('[healthController] db check failed', err);
    return res.status(503).json({ ok: false, db: false, error: err.message });
  }
}
