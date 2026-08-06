const AnalyticsService = require('../../services/AnalyticsService');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

/**
 * Analytics Controller (Thin Controller)
 * Delegates incident statistics, heatmaps, and zone analytics to AnalyticsService.
 */
module.exports = {
  async getStats(req, res, next) {
    try {
      const stats = await AnalyticsService.getStats(req.user);
      return sendSuccess(res, stats);
    } catch (err) {
      next(err);
    }
  },

  async getHeatmap(req, res, next) {
    try {
      const heatmap = await AnalyticsService.getHeatmap(req.user);
      return sendSuccess(res, heatmap);
    } catch (err) {
      next(err);
    }
  },

  async getIncidentsPageData(req, res, next) {
    try {
      const incidents = await AnalyticsService.getIncidentsPageData(req.user);
      return sendSuccess(res, incidents);
    } catch (err) {
      next(err);
    }
  },

  async getZoneAnalytics(req, res, next) {
    try {
      const zoneStats = await AnalyticsService.getZoneAnalytics(req.user);
      return sendSuccess(res, zoneStats);
    } catch (err) {
      next(err);
    }
  },

  async getReliefIncidents(req, res, next) {
    try {
      const data = await AnalyticsService.getReliefIncidents(req.user);
      if (!data) {
        return sendError(res, 'Relief Center not found', 404);
      }
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  },
};
