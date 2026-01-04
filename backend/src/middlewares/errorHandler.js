export function errorHandler(err, req, res, next) {
  // Log full error on server
  console.error('[errorHandler] error:', err);

  // Default response for production
  const isProd = process.env.NODE_ENV === 'production';

  // Check for Prisma / DB connection errors
  let clientMessage = 'Internal server error';
  const cause = err?.cause || err?.originalError || err;

  if (!isProd) {
    // Development: provide clearer messages for common DB/Prisma errors
    if (cause?.message?.includes('RSA public key is not available')) {
      clientMessage = 'Database connection failed: RSA public key not available. For local development, append `?allowPublicKeyRetrieval=true` to your DATABASE_URL or set `cachingRsaPublicKey` in the DB configuration.';
    } else if (cause?.message?.includes('pool timeout')) {
      clientMessage = 'Database connection timed out: connection pool exhausted. Ensure the database is reachable and DATABASE_URL is correct.';
    } else if (err?.message) {
      clientMessage = `Error: ${err.message}`;
    }

    // Include cause details and stack for debugging
    const details = {
      message: err.message,
      cause: cause?.message || cause,
      stack: err.stack,
    };

    return res.status(500).json({ error: clientMessage, details });
  }

  // Production: minimal error information
  return res.status(500).json({ error: clientMessage });
}
