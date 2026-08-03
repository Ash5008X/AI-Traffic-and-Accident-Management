/**
 * Severity/status utilities — consolidates duplicated helpers
 */

/**
 * Maps severity string to CSS class name.
 */
export function getSeverityClass(severity) {
  switch (severity?.toLowerCase()) {
    case 'critical': return 'critical';
    case 'high': return 'warning';
    case 'medium': return 'warning';
    case 'low': return 'info';
    default: return 'info';
  }
}

/**
 * Maps severity string to hex color.
 */
export function severityColor(severity) {
  const map = {
    critical: '#FF3B30',
    high: '#FF6B35',
    medium: '#FFB830',
    low: '#34C759',
  };
  return map[severity] || '#888';
}

/**
 * Maps report status to CSS class.
 */
export function getStatusClass(status) {
  switch (status?.toLowerCase()) {
    case 'pending': return 'pending';
    case 'assigned': return 'in-progress';
    case 'en_route': return 'en-route';
    case 'resolved': return 'resolved';
    case 'dismissed': return 'dismissed';
    default: return 'pending';
  }
}

/**
 * Normalizes incident types into fixed categories.
 */
export function categorizeType(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('accident')) return 'accident';
  if (t.includes('congestion')) return 'congestion';
  if (t.includes('route')) return 'route';
  if (t.includes('medical')) return 'accident';
  return 'system';
}

/**
 * Returns a hex color code based on the incident category.
 */
export function getTypeColor(category) {
  const map = {
    accident: '#FF6B35',
    congestion: '#FFB830',
    route: '#3A86FF',
    system: '#BF5AF2',
  };
  return map[category] || '#BF5AF2';
}
