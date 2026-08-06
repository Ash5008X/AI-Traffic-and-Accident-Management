const Incident = require('../models/Incident');

/**
 * Maps Zone string to 2-letter prefix (ZA, ZB, ZC, ZD, ZE, ZF).
 */
function getZonePrefix(zone) {
  if (!zone) return 'ZA';
  const z = String(zone).toUpperCase().replace(/ZONE/g, '').trim();
  if (['A', 'B', 'C', 'D', 'E', 'F'].includes(z)) {
    return `Z${z}`;
  }
  return 'ZA';
}

/**
 * Formats a Date object into DDMMYY-HHMMSS (24-hour format).
 */
function formatDateTimestamp(dateObj = new Date()) {
  const d = new Date(dateObj);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${dd}${mm}${yy}-${hh}${min}${ss}`;
}

/**
 * Generates a deterministic Incident ID in the format: <ZONE>-<DDMMYY>-<HHMMSS>[-<SUFFIX>]
 * Automatically checks MongoDB for collisions and appends a 2-digit sequential suffix (-01, -02, etc.) if needed.
 */
async function generateDeterministicIncidentId(zone, createdAt = new Date(), excludeId = null) {
  const prefix = getZonePrefix(zone);
  const timeStampStr = formatDateTimestamp(createdAt);
  const baseId = `${prefix}-${timeStampStr}`;

  let candidateId = baseId;
  let counter = 1;

  while (true) {
    const filter = { incidentId: candidateId };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }

    const exists = await Incident.exists(filter);
    if (!exists) {
      break;
    }

    const suffix = String(counter).padStart(2, '0');
    candidateId = `${baseId}-${suffix}`;
    counter++;
  }

  return candidateId;
}

/**
 * Migrates existing MongoDB documents with old or missing incident IDs to the new format.
 */
async function migrateIncidentIds() {
  try {
    const incidents = await Incident.find({}).sort({ createdAt: 1 });
    let updatedCount = 0;

    for (const inc of incidents) {
      const zone = inc.zone || 'Zone A';
      const createdAt = inc.createdAt || new Date();

      const newId = await generateDeterministicIncidentId(zone, createdAt, inc._id);

      if (inc.incidentId !== newId) {
        inc.incidentId = newId;
        await inc.save();
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      console.log(`[Migration] Successfully updated ${updatedCount} incident IDs.`);
    }
  } catch (err) {
    console.error('[Migration] Error during incident ID migration:', err.message);
  }
}

module.exports = {
  getZonePrefix,
  formatDateTimestamp,
  generateDeterministicIncidentId,
  migrateIncidentIds,
};
