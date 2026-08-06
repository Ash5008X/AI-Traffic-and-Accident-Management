/**
 * Formatting utilities — consolidates duplicated helpers from
 * user_dashboard.js, user_reports.js, user_alerts.js, relief_dashboard.js
 */

/**
 * Formats a date string into a human-readable 'time ago' format.
 * @param {string} dateStr - The ISO date string to format.
 * @returns {string} A relative time string (e.g., '5 min ago').
 */
export function timeAgo(dateStr) {
  if (!dateStr) return '—';
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

/**
 * Formats a date into 'DD MMM YYYY · HH:MM A IST' format using Indian Standard Time.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '---';
  try {
    const formatter = new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'medium',
      timeZone: 'Asia/Kolkata',
    });
    return formatter.format(new Date(dateStr)) + ' IST';
  } catch (e) {
    return dateStr;
  }
}

/**
 * Formats a date into time-only 'HH:MM:SS A IST' format.
 */
export function formatTimeUTC(dateStr) {
  if (!dateStr) return '---';
  try {
    const formatter = new Intl.DateTimeFormat('en-IN', {
      timeStyle: 'medium',
      timeZone: 'Asia/Kolkata',
    });
    return formatter.format(new Date(dateStr)) + ' IST';
  } catch (e) {
    return dateStr;
  }
}

/**
 * Formats a date into short 'HH:MM' format.
 */
export function formatTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Generates a live stopwatch-style elapsed time string.
 */
export function elapsedTimer(dateStr) {
  const start = new Date(dateStr);
  const diff = Math.max(0, Math.floor((Date.now() - start) / 1000));
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Tactical-style time ago for relief dashboard (e.g., '15M AGO').
 */
export function tacticalTimeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (diff < 1) return 'JUST NOW';
  return `${diff}M AGO`;
}

/**
 * Pads a number with leading zeros.
 */
export function padZero(n, len = 2) {
  return String(n).padStart(len, '0');
}

/**
 * Formats a location object for display.
 * Uses address if available, falls back to coordinates, then to 'Unknown Location'.
 */
export function formatLocation(location) {
  if (location?.address) return location.address;
  if (location?.lat != null && location?.lng != null) {
    const latPrefix = location.lat >= 0 ? 'N' : 'S';
    const lngPrefix = location.lng >= 0 ? 'E' : 'W';
    return `${Math.abs(location.lat).toFixed(4)}° ${latPrefix}, ${Math.abs(location.lng).toFixed(4)}° ${lngPrefix}`;
  }
  return 'Unknown Location';
}

/**
 * Standardizes zone string format to full 'Zone X' (e.g. 'Zone A', 'Zone B').
 */
export function formatZone(zone) {
  if (!zone) return 'Zone A';
  const str = String(zone).trim();
  if (str.startsWith('Zone ')) return str;
  if (str.length === 1 && str.toUpperCase() >= 'A' && str.toUpperCase() <= 'F') {
    return `Zone ${str.toUpperCase()}`;
  }
  return `Zone ${str}`;
}
