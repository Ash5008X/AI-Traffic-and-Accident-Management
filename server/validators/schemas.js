/**
 * Reusable input validators for API endpoints.
 */

function validateRegister(body) {
  const { name, email, password, role } = body || {};
  if (!name || !email || !password || !role) {
    return 'Name, email, password, and role are required.';
  }
  const validRoles = ['user', 'relief_admin', 'field_unit'];
  if (!validRoles.includes(role)) {
    return `Invalid role. Must be one of: ${validRoles.join(', ')}`;
  }
  return null;
}

function validateLogin(body) {
  const { email, password } = body || {};
  if (!email || !password) {
    return 'Email and password are required.';
  }
  return null;
}

function validateIncidentReport(body) {
  const { type, location } = body || {};
  if (!type) {
    return 'Incident type is required.';
  }
  if (!location || location.lat == null || location.lng == null) {
    return 'Live location (lat, lng) is required to submit an incident report.';
  }
  return null;
}

function validateLocationObject(location) {
  if (!location || location.lat == null || location.lng == null) {
    return 'Valid location object with { lat, lng } is required.';
  }
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return 'Location coordinates lat/lng are out of valid bounds.';
  }
  return null;
}

function validateTeamCreation(body) {
  const { name, zone } = body || {};
  if (!name || !zone) {
    return 'Team name and sector zone are required.';
  }
  return null;
}

module.exports = {
  validateRegister,
  validateLogin,
  validateIncidentReport,
  validateLocationObject,
  validateTeamCreation,
};
