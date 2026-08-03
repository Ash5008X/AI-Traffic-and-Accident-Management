const { sendError } = require('../utils/apiResponse');

/**
 * Centralized global Express error handling middleware.
 * Catches Mongoose validation errors, duplicate key errors, invalid ObjectIds, and unhandled exceptions.
 */
function errorHandler(err, req, res, next) {
  console.error(`[Error] ${req.method} ${req.originalUrl} ->`, err.message);

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return sendError(res, messages.join('. '), 400);
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'Field';
    return sendError(res, `${field} already exists.`, 409);
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return sendError(res, 'Invalid ID format', 400);
  }

  // JWT Token Error
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return sendError(res, 'Invalid or expired authentication token', 401);
  }

  // Default Error
  const statusCode = err.status || err.statusCode || 500;
  return sendError(res, err.message || 'Internal Server Error', statusCode);
}

module.exports = errorHandler;
