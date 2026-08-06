const LocationService = require('../../services/LocationService');
const ZoneService = require('../../services/ZoneService');

/**
 * Resolves an incident's zone from stored MongoDB fields using ZoneService.
 */
function resolveZone(inc) {
  return ZoneService.resolveZone(inc);
}

/**
 * Fetches the currently logged-in Relief Center's stored document and coordinates using LocationService.
 */
async function getCenterCoords(reqUser) {
  return LocationService.getReliefCenterCoords(reqUser);
}

/**
 * Builds MongoDB ownership filter for a Relief Center ID & User ID using LocationService.
 */
function buildCenterFilter(centerDoc, reqUser) {
  return LocationService.buildCenterFilter(centerDoc, reqUser);
}

module.exports = {
  resolveZone,
  getCenterCoords,
  buildCenterFilter,
};
