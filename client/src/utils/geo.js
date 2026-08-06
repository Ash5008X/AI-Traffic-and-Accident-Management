/**
 * Geospatial utilities — consolidates from user_alerts.js
 */

/**
 * Calculates distance between two points using Haversine formula.
 * @returns {number} Distance in kilometers.
 */
export function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calculates bearing between two geographical points.
 */
export function getBearing(lat1, lon1, lat2, lon2) {
  const y =
    Math.sin(((lon2 - lon1) * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/**
 * Maps coordinates to a sector zone (A-F) based on bearing from center.
 * Center coordinates must be passed explicitly from caller.
 */
export function getZone(lat, lng, center) {
  if (!center || center.lat == null || center.lng == null) {
    return 'Zone A';
  }
  const bearing = getBearing(center.lat, center.lng, lat, lng);
  const idx = Math.floor(bearing / 60);
  return `Zone ${String.fromCharCode(65 + Math.min(idx, 5))}`;
}

/**
 * Returns neighbor zones for a given zone.
 */
export function getNeighborZones(zone) {
  const z = zone?.replace('Zone ', '') || 'A';
  const map = {
    A: ['F', 'B'],
    B: ['A', 'C'],
    C: ['B', 'D'],
    D: ['C', 'E'],
    E: ['D', 'F'],
    F: ['E', 'A'],
  };
  return (map[z] || []).map((item) => `Zone ${item}`);
}
