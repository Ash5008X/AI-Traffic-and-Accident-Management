const IncidentRepository = require('../repositories/IncidentRepository');
const FieldUnitRepository = require('../repositories/FieldUnitRepository');
const AlertRepository = require('../repositories/AlertRepository');
const LocationService = require('./LocationService');
const ZoneService = require('./ZoneService');

/**
 * DashboardService
 * Generates aggregated queue datasets, operational stats, and mini map payloads for dashboards via Repositories.
 */
class DashboardService {
  /**
   * Generates complete Relief Center Dashboard dataset via Repositories.
   */
  static async getReliefDashboard(reqUser) {
    const { centerDoc: reliefCenter } = await LocationService.getReliefCenterCoords(reqUser);
    if (!reliefCenter) return null;

    const centerFilter = LocationService.buildCenterFilter(reliefCenter, reqUser);
    const now = new Date();
    const last1Hour = new Date(now.getTime() - 60 * 60 * 1000);

    // 1. Incident Queue: last 1 hour OR active incidents assigned to logged-in Relief Center, newest first
    let queueIncidents = await IncidentRepository.find({
      $and: [
        centerFilter,
        {
          $or: [
            { createdAt: { $gte: last1Hour } },
            { status: { $nin: ['resolved', 'dismissed'] } },
          ],
        },
      ],
    }, { populate: true, lean: true });

    queueIncidents = queueIncidents.map((inc) => ({
      ...inc,
      zone: ZoneService.resolveZone(inc),
      assignedZone: ZoneService.resolveZone(inc),
    }));

    // 2. Active Count
    const activeCount = await IncidentRepository.countDocuments({
      ...centerFilter,
      status: { $nin: ['resolved', 'dismissed'] },
    });

    // 3. Critical Count
    const criticalCount = await IncidentRepository.countDocuments({
      ...centerFilter,
      severity: 'critical',
      status: { $nin: ['resolved', 'dismissed'] },
    });

    // 4. Sector Heatmap & Zone Analytics
    const zoneAnalytics = ZoneService.getEmptyZoneAnalytics();
    const incidentsForCenter = await IncidentRepository.find(centerFilter, { lean: true });

    incidentsForCenter.forEach((inc) => {
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

    // 5. Mini Operational Map
    let mapIncidents = await IncidentRepository.find({
      ...centerFilter,
      status: { $nin: ['resolved', 'dismissed'] },
    }, { lean: true });

    mapIncidents = mapIncidents.map((inc) => ({
      ...inc,
      zone: ZoneService.resolveZone(inc),
      assignedZone: ZoneService.resolveZone(inc),
    }));

    // 6. Real-Time Broadcast Panel
    const broadcasts = await AlertRepository.find({
      broadcastId: { $exists: true, $ne: null },
    }, { limit: 10, lean: true });

    return {
      reliefCenter,
      queue: queueIncidents,
      activeCount,
      criticalCount,
      zoneAnalytics,
      mapIncidents,
      broadcasts,
    };
  }

  /**
   * Generates general dashboard statistics and response metrics via Repositories.
   */
  static async dashboardStats(reqUser) {
    const { centerDoc } = await LocationService.getReliefCenterCoords(reqUser);
    if (!centerDoc) return null;

    const centerLat = centerDoc.location?.lat ?? centerDoc.latitude;
    const centerLng = centerDoc.location?.lng ?? centerDoc.longitude;
    const RADIUS_KM = centerDoc.coverageRadiusKm || LocationService.DEFAULT_COVERAGE_RADIUS_KM;

    const centerFilter = LocationService.buildCenterFilter(centerDoc, reqUser);
    const allIncidents = await IncidentRepository.find(centerFilter, { lean: true });

    const activeIncidents = allIncidents.filter(
      (inc) => !['resolved', 'dismissed'].includes(inc.status)
    );

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const resolvedToday = allIncidents.filter(
      (inc) => inc.status === 'resolved' && inc.resolvedAt && new Date(inc.resolvedAt) >= todayStart
    );

    let avgResponseMinutes = null;
    if (resolvedToday.length > 0) {
      const totalMs = resolvedToday.reduce((sum, inc) => {
        return sum + (new Date(inc.resolvedAt) - new Date(inc.createdAt));
      }, 0);
      avgResponseMinutes = Math.round(totalMs / resolvedToday.length / 60000);
    }

    const zoneBreakdown = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    for (const inc of activeIncidents) {
      const zName = ZoneService.resolveZone(inc);
      const letter = zName.replace('Zone ', '');
      if (zoneBreakdown[letter] !== undefined) {
        zoneBreakdown[letter]++;
      } else {
        zoneBreakdown.A++;
      }
    }

    const fieldUnits = await FieldUnitRepository.find({}, { populate: true, lean: true });

    return {
      centerLat,
      centerLng,
      radiusKm: RADIUS_KM,
      activeCount: activeIncidents.length,
      resolvedTodayCount: resolvedToday.length,
      avgResponseMinutes,
      activeIncidents,
      zoneBreakdown,
      fieldUnits,
    };
  }
}

module.exports = DashboardService;
