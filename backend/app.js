import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './src/routes/auth.js';
import adminRoutes from './src/routes/admin.js';
import ownerRoutes from './src/routes/owner.js';
import tenantRoutes from './src/routes/tenant.js';
import roomRoutes from './src/routes/rooms.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Only parse JSON for non-multipart requests
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return next();
  }
  express.json()(req, res, next);
});

// CORS middleware (allow any origin while supporting credentials)
app.use((req, res, next) => {
  const origin = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:5173';
  // Echo the Origin header so browsers accept credentials instead of using '*'
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.get('/', (_req, res) => res.json({ status: 'ok' }));

import healthRoutes from './src/routes/health.js';
import { prisma } from './src/lib/prisma.js';

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/tenant', tenantRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/health', healthRoutes);

// Error handling middleware (should be the last middleware)
import { errorHandler } from './src/middlewares/errorHandler.js';
app.use(errorHandler);

// Verify DB connectivity at startup (fail fast with helpful hint)
(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('[startup] Database connection OK');
  } catch (err) {
    console.error('[startup] Database connection failed:', err);
    console.error('[startup] Hint: verify DATABASE_URL and that the database is running.');
    console.error('[startup] If you see an RSA public key error, append `?allowPublicKeyRetrieval=true&useSSL=false` to your DATABASE_URL in `backend/.env`.');
    // Exit so the developer notices and addresses the issue
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
})();

export default app;
