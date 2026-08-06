const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/apiResponse');

/**
 * JWT Authentication Middleware.
 * Verifies Bearer token and attaches decoded user payload to req.user.
 */
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Access denied. No token provided.', 401);
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nexustraffic_super_secret_jwt_key_2026');
    req.user = decoded;
    next();
  } catch (err) {
    return sendError(res, 'Invalid or expired token', 401);
  }
}

/**
 * Optional JWT Authentication Middleware.
 * Decodes Bearer token if present, but lets request proceed if not provided.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nexustraffic_super_secret_jwt_key_2026');
      req.user = decoded;
    } catch (err) {
      // Ignore invalid token for optional auth
    }
  }
  next();
}

auth.auth = auth;
auth.optionalAuth = optionalAuth;

module.exports = auth;
