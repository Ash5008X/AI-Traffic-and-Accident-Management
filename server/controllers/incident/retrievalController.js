const IncidentService = require('../../services/IncidentService');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

/**
 * Retrieval Controller (Thin Controller)
 * Delegates retrieval operations to IncidentService.
 */
module.exports = {
  async getAll(req, res, next) {
    try {
      const incidents = await IncidentService.getAll(req.user);
      return sendSuccess(res, incidents);
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const incident = await IncidentService.getById(req.params.id);
      if (!incident) {
        return sendError(res, 'Incident not found', 404);
      }
      return sendSuccess(res, incident);
    } catch (err) {
      next(err);
    }
  },

  async nearby(req, res, next) {
    try {
      const nearby = await IncidentService.nearby(req.user);
      return sendSuccess(res, nearby);
    } catch (err) {
      next(err);
    }
  },
};
