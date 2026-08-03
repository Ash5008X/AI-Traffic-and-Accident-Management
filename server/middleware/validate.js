const { sendError } = require('../utils/apiResponse');

/**
 * Reusable Express middleware factory for validating request body payloads.
 * Intercepts invalid requests before reaching controller logic.
 *
 * @param {Function} validatorFn - Function returning error string or null
 * @returns {Function} Express middleware handler
 */
function validateRequest(validatorFn) {
  return (req, res, next) => {
    if (!validatorFn || typeof validatorFn !== 'function') {
      return next();
    }
    const errorMessage = validatorFn(req.body);
    if (errorMessage) {
      return sendError(res, errorMessage, 400);
    }
    return next();
  };
}

module.exports = {
  validateRequest,
};
