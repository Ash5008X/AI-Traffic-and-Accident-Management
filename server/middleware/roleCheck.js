const { sendError } = require('../utils/apiResponse');

/**
 * Role authorization guard middleware.
 * Usage: roleCheck('relief_admin', 'field_unit')
 */
function roleCheck(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(res, 'Insufficient permissions for this operation.', 403);
    }
    next();
  };
}

module.exports = roleCheck;
