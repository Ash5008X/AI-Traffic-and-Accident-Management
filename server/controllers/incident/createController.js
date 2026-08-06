const IncidentService = require('../../services/IncidentService');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

/**
 * Create Controller (Thin Controller)
 * Validates requests and delegates incident creation to IncidentService.
 */
module.exports = {
  async create(req, res, next) {
    try {
      const { location } = req.body;

      if (!location || location.lat == null || location.lng == null) {
        return sendError(res, 'Live location (lat, lng) is required to submit a report.', 400);
      }

      const incident = await IncidentService.create(req.body, req.user);
      return sendSuccess(res, incident, 201);
    } catch (err) {
      next(err);
    }
  },
};
