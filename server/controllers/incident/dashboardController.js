const DashboardService = require('../../services/DashboardService');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

/**
 * Dashboard Controller (Thin Controller)
 * Delegates relief center dashboard payloads and metrics to DashboardService.
 */
module.exports = {
  async dashboardStats(req, res, next) {
    try {
      const stats = await DashboardService.dashboardStats(req.user);
      if (!stats) {
        return sendError(res, 'Relief Center location not found in database', 400);
      }
      return sendSuccess(res, stats);
    } catch (err) {
      next(err);
    }
  },

  async getReliefDashboard(req, res, next) {
    try {
      const data = await DashboardService.getReliefDashboard(req.user);
      if (!data) {
        return sendError(res, 'Relief Center not found', 404);
      }
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },
};
