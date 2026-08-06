const DispatchService = require('../../services/DispatchService');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

/**
 * Dispatch Controller (Thin Controller)
 * Delegates unit dispatch, assignment requests, and backup requests to DispatchService.
 */
module.exports = {
  async accept(req, res, next) {
    try {
      const incident = await DispatchService.accept(req.params.id, req.body, req.user);
      if (!incident) {
        return sendError(res, 'Incident not found', 404);
      }
      return sendSuccess(res, incident);
    } catch (err) {
      next(err);
    }
  },

  async requestAssignment(req, res, next) {
    try {
      const incident = await DispatchService.requestAssignment(req.params.id, req.user);
      if (!incident) {
        return sendError(res, 'Incident not found', 404);
      }
      return sendSuccess(res, { success: true });
    } catch (err) {
      next(err);
    }
  },

  async backupRequest(req, res, next) {
    try {
      const incident = await DispatchService.backupRequest(req.params.id, req.body.details, req.user);
      if (!incident) {
        return sendError(res, 'Incident not found', 404);
      }
      return sendSuccess(res, { success: true, message: 'Backup request sent' });
    } catch (err) {
      next(err);
    }
  },
};
