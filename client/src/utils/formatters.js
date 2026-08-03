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
 * Formats a date into 'YYYY-MM-DD · HH:MM:SS UTC' format.
 */
export function formatDate(dateStr) {
  if (!dateStr) return '---';
  const date = new Date(dateStr);
  return `${date.toISOString().split('T')[0]} · ${date.toISOString().split('T')[1].substring(0, 8)} UTC`;
}

/**
 * Formats a date into time-only 'HH:MM:SS UTC' format.
 */
export function formatTimeUTC(dateStr) {
  if (!dateStr) return '---';
  const d = new Date(dateStr);
  return `${d.toISOString().split('T')[1].substring(0, 8)} UTC`;
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
