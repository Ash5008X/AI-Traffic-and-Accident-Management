const IncidentService = require('../../services/IncidentService');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

/**
 * Status Controller (Thin Controller)
 * Delegates status changes and dismissals to IncidentService.
 */
module.exports = {
  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      if (!status) {
        return sendError(res, 'Status is required', 400);
      }

      const incident = await IncidentService.updateStatus(req.params.id, status, req.user);
      if (!incident) {
        return sendError(res, 'Incident not found', 404);
      }

      return sendSuccess(res, incident);
    } catch (err) {
      next(err);
    }
  },

  async dismiss(req, res, next) {
    try {
      const incident = await IncidentService.dismiss(req.params.id, req.body.dismissReason, req.user);
      if (!incident) {
        return sendError(res, 'Incident not found', 404);
      }

      return sendSuccess(res, incident);
    } catch (err) {
      next(err);
    }
  },
};
