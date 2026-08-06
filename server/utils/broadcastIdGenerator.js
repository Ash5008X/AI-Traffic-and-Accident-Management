const Alert = require('../models/Alert');
const { getZonePrefix, formatDateTimestamp } = require('./incidentIdGenerator');

/**
 * Generates a deterministic Broadcast ID in the format: B<ZONE>-<DDMMYY>-<HHMMSS>[-<SUFFIX>]
 *
 * Examples:
 *   BZA-050826-202204
 *   BZB-050826-094511
 *   BZA-050826-202204-01  (collision suffix)
 *
 * @param {string} zone - Zone string (e.g. 'Zone A', 'Zone D', 'All Zones')
 * @param {Date}   [createdAt=new Date()] - Timestamp for the broadcast
 * @returns {Promise<string>} The unique broadcast ID
 */
async function generateBroadcastId(zone, createdAt = new Date()) {
  // For 'All Zones', use 'ZA' as the prefix (global broadcasts)
  const isAllZones = !zone || zone.toLowerCase().includes('all');
  const prefix = isAllZones ? 'ZA' : getZonePrefix(zone);
  const timeStampStr = formatDateTimestamp(createdAt);
  const baseId = `B${prefix}-${timeStampStr}`;

  let candidateId = baseId;
  let counter = 1;

  while (true) {
    const exists = await Alert.exists({ broadcastId: candidateId });
    if (!exists) {
      break;
    }

    const suffix = String(counter).padStart(2, '0');
    candidateId = `${baseId}-${suffix}`;
    counter++;
  }

  return candidateId;
}

module.exports = { generateBroadcastId };
