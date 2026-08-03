/**
 * Standardized API response utilities.
 */

function sendSuccess(res, data, statusCode = 200, message = null) {
  return res.status(statusCode).json(data);
}

function sendError(res, message, statusCode = 500, details = null) {
  const payload = { error: message };
  if (details) payload.details = details;
  return res.status(statusCode).json(payload);
}

module.exports = { sendSuccess, sendError };
