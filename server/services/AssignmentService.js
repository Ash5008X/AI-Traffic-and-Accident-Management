const ReliefCenterRepository = require('../repositories/ReliefCenterRepository');
const LocationService = require('./LocationService');
const ZoneService = require('./ZoneService');

/**
 * AssignmentService
 * Responsible exclusively for incident-to-center routing, coverage validation,
 * nearest Relief Center resolution, and radius overlap handling.
 */
class AssignmentService {
  /**
   * Finds an existing Relief Center near given (lng, lat) within maxDistanceMeters.
   * Used during registration to prevent duplicate centers within proximity.
   */
  static async findNearbyReliefCenter(lng, lat, maxDistanceMeters = 3000) {
    const centers = await ReliefCenterRepository.find({}, { select: null, lean: true });
    for (const center of centers) {
      const cLat = center.location?.lat ?? center.latitude;
      const cLng = center.location?.lng ?? center.longitude;
      if (cLat != null && cLng != null) {
        const distKm = LocationService.calculateDistance(lat, lng, cLat, cLng);
        if (distKm * 1000 <= maxDistanceMeters) {
          return center;
        }
      }
    }
    return null;
  }

  /**
   * Assigns an incident to the nearest Relief Center and determines its operational zone.
   * Uses LocationService for distance calculations and ZoneService for zone classification.
   */
  static async assignToNearestCenter(location) {
    const { lat, lng } = LocationService.normalizeCoordinates(location);

    const centers = await ReliefCenterRepository.find({}, { select: null, lean: true });

    if (!centers || centers.length === 0) {
      return {
        reliefCenterId: null,
        zone: 'Zone A',
        distanceKm: 0,
        isOutsideCoverage: true,
        coveringCentersCount: 0,
      };
    }

    const centerDistances = centers.map((center) => {
      const cLat = center.location?.lat ?? center.latitude;
      const cLng = center.location?.lng ?? center.longitude;
      const radius = center.coverageRadiusKm || LocationService.DEFAULT_COVERAGE_RADIUS_KM;
      const distance = LocationService.calculateDistance(lat, lng, cLat, cLng);

      return {
        center,
        centerLat: cLat,
        centerLng: cLng,
        distance,
        radius,
        isWithinRadius: distance <= radius,
      };
    });

    const coveringCenters = centerDistances.filter((cd) => cd.isWithinRadius);

    let selected;
    let isOutsideCoverage = false;

    if (coveringCenters.length >= 1) {
      coveringCenters.sort((a, b) => a.distance - b.distance);
      selected = coveringCenters[0];
      isOutsideCoverage = false;
    } else {
      centerDistances.sort((a, b) => a.distance - b.distance);
      selected = centerDistances[0];
      isOutsideCoverage = true;
    }

    const zone = ZoneService.classifyZone(selected.centerLat, selected.centerLng, lat, lng);

    return {
      reliefCenterId: selected.center._id,
      zone,
      distanceKm: Math.round(selected.distance * 100) / 100,
      isOutsideCoverage,
      coveringCentersCount: coveringCenters.length,
    };
  }

  /**
   * Auto-assigns a newly registered field unit member to all Relief Admins within a given radius.
   */
  static async assignFieldUnitToNearbyAdmins(memberId, location, radiusKm = 5) {
    if (!location || location.lat == null || location.lng == null) return;
    const admins = await ReliefCenterRepository.find({ role: 'relief_admin' }, { select: null, lean: true });

    for (const admin of admins) {
      if (admin.location && admin.location.lat != null && admin.location.lng != null) {
        const dist = LocationService.calculateDistance(location.lat, location.lng, admin.location.lat, admin.location.lng);
        if (dist <= radiusKm) {
          await ReliefCenterRepository.findByIdAndUpdate(
            admin._id,
            { $addToSet: { unassignedMembers: memberId } },
            { new: true }
          );
          console.log(`[AssignmentService] Member ${memberId} added to Admin ${admin.name} (Distance: ${dist.toFixed(2)} km)`);
        }
      }
    }
  }
}

module.exports = AssignmentService;
