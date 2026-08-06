/**
 * ZoneService.js
 * Single source of truth for all operational zone logic, classifications,
 * sector angle determinations, legacy zone name normalizations, and analytics structures.
 */

const ALL_ZONES = Object.freeze(['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'Zone F']);

class ZoneService {
  static ALL_ZONES = ALL_ZONES;

  /**
   * Standardizes and normalizes any zone input (e.g. 'A', 'Zone A', 'SECTOR-N') to canonical 'Zone X' format.
   * Preserves backward compatibility while guaranteeing clean output.
   */
  static normalizeZone(input) {
    if (!input) return 'Zone A';
    const str = String(input).trim();

    // Exact matches
    if (ALL_ZONES.includes(str)) {
      return str;
    }

    // Single letter match ('A' -> 'Zone A')
    const upper = str.toUpperCase();
    if (upper.length === 1 && upper >= 'A' && upper <= 'F') {
      return `Zone ${upper}`;
    }

    // Legacy Sector code matches
    switch (upper) {
      case 'SECTOR-N':
      case 'SECTOR_N':
      case 'NORTH':
        return 'Zone A';
      case 'SECTOR-S':
      case 'SECTOR_S':
      case 'SOUTH':
        return 'Zone B';
      case 'SECTOR-E':
      case 'SECTOR_E':
      case 'EAST':
        return 'Zone C';
      case 'SECTOR-W':
      case 'SECTOR_W':
      case 'WEST':
        return 'Zone D';
      default:
        // Case-insensitive regex match for 'zone X'
        const match = upper.match(/^ZONE\s*([A-F])$/);
        if (match) {
          return `Zone ${match[1]}`;
        }
        return 'Zone A';
    }
  }

  /**
   * Resolves an incident's zone from stored MongoDB fields (assignedZone / zone).
   * Permanent source of truth is the stored zone.
   */
  static resolveZone(inc) {
    if (!inc) return 'Zone A';
    const rawZone = inc.assignedZone || inc.zone;
    return this.normalizeZone(rawZone);
  }

  /**
   * Validates if a string is a valid recognized zone name.
   */
  static isValidZone(zoneName) {
    if (!zoneName) return false;
    const normalized = this.normalizeZone(zoneName);
    return ALL_ZONES.includes(normalized);
  }

  /**
   * Calculates bearing (degrees, 0=North, clockwise) from center to point.
   */
  static bearingDeg(centerLat, centerLng, pointLat, pointLng) {
    const lat1 = (centerLat * Math.PI) / 180;
    const lat2 = (pointLat * Math.PI) / 180;
    const dLon = ((pointLng - centerLng) * Math.PI) / 180;
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const brng = (Math.atan2(y, x) * 180) / Math.PI;
    return (brng + 360) % 360;
  }

  /**
   * Classify a point into zones A-F based on bearing relative to center.
   * Arc Division: 6 equal 60° wedges starting clockwise from North
   *   A: 0°  – 60°   (NNE → ENE)
   *   B: 60° – 120°  (ENE → ESE)
   *   C: 120°– 180°  (ESE → S)
   *   D: 180°– 240°  (S   → WSW)
   *   E: 240°– 300°  (WSW → WNW)
   *   F: 300°– 360°  (WNW → N)
   */
  static classifyZone(centerLat, centerLng, pointLat, pointLng) {
    if (centerLat == null || centerLng == null || pointLat == null || pointLng == null) {
      return 'Zone A';
    }
    const bearing = this.bearingDeg(centerLat, centerLng, pointLat, pointLng);
    const zoneIndex = Math.floor(bearing / 60);
    const letter = String.fromCharCode(65 + Math.min(zoneIndex, 5));
    return `Zone ${letter}`;
  }

  /**
   * Generates an empty Zone Analytics structure for Zone A through Zone F.
   */
  static getEmptyZoneAnalytics() {
    const analytics = {};
    ALL_ZONES.forEach((z) => {
      analytics[z] = { active: 0, resolved: 0 };
    });
    return analytics;
  }

  /**
   * Generates an empty Zone Count mapping for Zone A through Zone F.
   */
  static getEmptyZoneCounts() {
    const counts = {};
    ALL_ZONES.forEach((z) => {
      counts[z] = 0;
    });
    return counts;
  }
}

module.exports = ZoneService;
