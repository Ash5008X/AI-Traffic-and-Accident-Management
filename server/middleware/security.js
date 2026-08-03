/**
 * Production Security Headers & In-Memory Rate Limiter Middleware
 * Eliminates need for external dependency while hardening HTTP security.
 */

const securityHeaders = (req, res, next) => {
  // Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Enable browser XSS filtering
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Strict Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  // HSTS (HTTP Strict Transport Security)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  // Remove Express fingerprint
  res.removeHeader('X-Powered-By');
  next();
};

/**
 * Lightweight in-memory rate limiter factory for API endpoints
 * @param {Object} options - { windowMs: number, maxRequests: number, message: string }
 */
function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  maxRequests = 50,
  message = 'Too many requests from this IP, please try again later.',
} = {}) {
  const ipHits = new Map();

  // Periodic cleanup of expired entries
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipHits.entries()) {
      if (now > record.resetTime) {
        ipHits.delete(ip);
      }
    }
  }, windowMs);

  // Allow Node process to exit without waiting for interval
  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!ipHits.has(ip)) {
      ipHits.set(ip, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    const record = ipHits.get(ip);
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    record.count += 1;
    if (record.count > maxRequests) {
      const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({
        success: false,
        error: message,
        retryAfterSeconds,
      });
    }

    next();
  };
}

// Pre-configured rate limiters for sensitive endpoints
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 30, // 30 login/register attempts per IP per 15m
  message: 'Too many authentication attempts. Please wait 15 minutes before retrying.',
});

module.exports = {
  securityHeaders,
  createRateLimiter,
  authLimiter,
};
