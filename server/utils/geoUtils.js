/**
 * Geospatial utility functions delegating to LocationService & ZoneService.
 */
const LocationService = require('../services/LocationService');
const ZoneService = require('../services/ZoneService');

/**
 * Haversine distance between two lat/lng points (returns km)
 */
function haversineKm(lat1, lon1, lat2, lon2) {
  return LocationService.calculateDistance(lat1, lon1, lat2, lon2);
}

/**
 * Bearing (degrees, 0=North, clockwise) from center to point
 */
function bearingDeg(centerLat, centerLng, pointLat, pointLng) {
  return ZoneService.bearingDeg(centerLat, centerLng, pointLat, pointLng);
}

/**
 * Classify a point into zones A-F (delegates exclusively to ZoneService).
 */
function classifyZone(centerLat, centerLng, pointLat, pointLng) {
  return ZoneService.classifyZone(centerLat, centerLng, pointLat, pointLng);
}

/**
 * Filter incidents within radiusKm of center and annotate with zone
 */
function filterAndAnnotate(incidents, centerLat, centerLng, radiusKm = LocationService.DEFAULT_COVERAGE_RADIUS_KM) {
  return incidents
    .filter((inc) => {
      if (!inc.location || inc.location.lat == null || inc.location.lng == null) return false;
      return LocationService.isWithinCoverage(centerLat, centerLng, inc.location.lat, inc.location.lng, radiusKm);
    })
    .map((inc) => ({
      ...inc,
      zone: ZoneService.classifyZone(centerLat, centerLng, inc.location.lat, inc.location.lng),
      distanceKm: Number(LocationService.calculateDistance(centerLat, centerLng, inc.location.lat, inc.location.lng).toFixed(2)),
    }));
}

module.exports = { haversineKm, bearingDeg, classifyZone, filterAndAnnotate };
