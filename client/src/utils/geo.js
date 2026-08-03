/**
 * Geospatial utilities — consolidates from user_alerts.js
 */
import { CENTER_LOC } from './constants';

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
 */
export function getZone(lat, lng, center = CENTER_LOC) {
  const bearing = getBearing(center.lat, center.lng, lat, lng);
  const idx = Math.floor(bearing / 60);
  return String.fromCharCode(65 + idx);
}

/**
 * Returns neighbor zones for a given zone.
 */
export function getNeighborZones(zone) {
  const map = {
    A: ['F', 'B'],
    B: ['A', 'C'],
    C: ['B', 'D'],
    D: ['C', 'E'],
    E: ['D', 'F'],
    F: ['E', 'A'],
  };
  return map[zone] || [];
}
