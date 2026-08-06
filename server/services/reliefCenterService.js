const ReliefCenter = require('../models/ReliefCenter');
const LocationService = require('./LocationService');
const ZoneService = require('./ZoneService');

/**
 * Service function to find an existing ReliefCenter near given (lng, lat) within maxDistanceMeters.
 */
async function findNearbyReliefCenter(lng, lat, maxDistanceMeters = 3000) {
  const centers = await ReliefCenter.find({}).lean();
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
 * Uses LocationService exclusively for distance calculations and ZoneService for zone classification.
 */
async function assignIncidentToNearestReliefCenter(location) {
  const { lat, lng } = LocationService.normalizeCoordinates(location);

  const centers = await ReliefCenter.find({}).lean();

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

module.exports = {
  findNearbyReliefCenter,
  assignIncidentToNearestReliefCenter,
};
