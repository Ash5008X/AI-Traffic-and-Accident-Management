const IncidentRepository = require('../repositories/IncidentRepository');
const LocationService = require('./LocationService');
const ZoneService = require('./ZoneService');

/**
 * AnalyticsService
 * Handles incident statistics, sector heatmaps, zone analytics, and Incidents page data queries via Repositories.
 */
class AnalyticsService {
  /**
   * Generates summary statistics: total, active, resolved, and critical incident counts via IncidentRepository.
   */
  static async getStats(reqUser) {
    const { centerDoc } = await LocationService.getReliefCenterCoords(reqUser);
    const centerFilter = LocationService.buildCenterFilter(centerDoc, reqUser);

    const total = await IncidentRepository.countDocuments(centerFilter);
    const active = await IncidentRepository.countDocuments({ ...centerFilter, status: { $nin: ['resolved', 'dismissed'] } });
    const resolved = await IncidentRepository.countDocuments({ ...centerFilter, status: 'resolved' });
    const critical = await IncidentRepository.countDocuments({
      ...centerFilter,
      status: { $nin: ['resolved', 'dismissed'] },
      severity: 'critical',
    });

    return { total, active, resolved, critical };
  }

  /**
   * Generates active incident counts per Zone A - Zone F for sector heatmaps via IncidentRepository.
   */
  static async getHeatmap(reqUser) {
    const { centerDoc } = await LocationService.getReliefCenterCoords(reqUser);
    const centerFilter = LocationService.buildCenterFilter(centerDoc, reqUser);

    const filter = {
      ...centerFilter,
      status: { $nin: ['resolved', 'dismissed'] },
    };

    const activeIncidents = await IncidentRepository.find(filter, { lean: true });

    const counts = {
      'Zone A': 0,
      'Zone B': 0,
      'Zone C': 0,
      'Zone D': 0,
      'Zone E': 0,
      'Zone F': 0,
    };

    for (const inc of activeIncidents) {
      const zoneName = ZoneService.resolveZone(inc);
      if (counts[zoneName] !== undefined) {
        counts[zoneName]++;
      }
    }

    return counts;
  }

  /**
   * Generates active & resolved breakdown per Zone A - Zone F via IncidentRepository.
   */
  static async getZoneAnalytics(reqUser) {
    const { centerDoc } = await LocationService.getReliefCenterCoords(reqUser);
    const centerFilter = LocationService.buildCenterFilter(centerDoc, reqUser);

    const incidents = await IncidentRepository.find(centerFilter, { lean: true });
    const zoneStats = ZoneService.getEmptyZoneAnalytics();

    for (const inc of incidents) {
      const zoneName = ZoneService.resolveZone(inc);
      if (zoneStats[zoneName]) {
        if (['resolved', 'dismissed'].includes(inc.status)) {
          zoneStats[zoneName].resolved++;
        } else {
          zoneStats[zoneName].active++;
        }
      }
    }

    return zoneStats;
  }

  /**
   * Fetches incidents page dataset with populated fields via IncidentRepository.
   */
  static async getIncidentsPageData(reqUser) {
    const { centerDoc } = await LocationService.getReliefCenterCoords(reqUser);
    const centerFilter = LocationService.buildCenterFilter(centerDoc, reqUser);

    let incidents = await IncidentRepository.find(centerFilter, { populate: true, lean: true });

    return incidents.map((inc) => ({
      ...inc,
      zone: ZoneService.resolveZone(inc),
      assignedZone: ZoneService.resolveZone(inc),
    }));
  }

  /**
   * Fetches Relief Center Incidents page dataset and zone analytics via IncidentRepository.
   */
  static async getReliefIncidents(reqUser) {
    const { centerDoc: reliefCenter } = await LocationService.getReliefCenterCoords(reqUser);
    if (!reliefCenter) return null;

    const centerFilter = LocationService.buildCenterFilter(reliefCenter, reqUser);
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    let incidents = await IncidentRepository.find({
      $and: [
        centerFilter,
        {
          $or: [
            { createdAt: { $gte: last24Hours } },
            { status: { $nin: ['resolved', 'dismissed'] } },
          ],
        },
      ],
    }, { populate: true, lean: true });

    incidents = incidents.map((inc) => ({
      ...inc,
      zone: ZoneService.resolveZone(inc),
      assignedZone: ZoneService.resolveZone(inc),
    }));

    const zoneAnalytics = ZoneService.getEmptyZoneAnalytics();
    incidents.forEach((inc) => {
      const z = ZoneService.resolveZone(inc);
      const isResolved = ['resolved', 'dismissed'].includes(inc.status);
      if (zoneAnalytics[z]) {
        if (isResolved) {
          zoneAnalytics[z].resolved++;
        } else {
          zoneAnalytics[z].active++;
        }
      }
    });

    return {
      reliefCenter,
      incidents,
      mapIncidents: incidents,
      zoneAnalytics,
    };
  }
}

module.exports = AnalyticsService;
