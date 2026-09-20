// API base URL and auth storage key
export const API_BASE = window.NEXUS_API_BASE || '/api';
export const AUTH_KEY = 'nexustraffic_auth';
export const THEME_KEY = 'nt-theme';

// Dashboard paths by role
export const DASHBOARD_BY_ROLE = {
  user: '/dashboard',
  relief_admin: '/relief/dashboard',
  field_unit: '/field/mission',
};

// Navigation items by role
export const NAV_BY_ROLE = {
  user: [
    { label: 'Home', path: '/dashboard', icon: 'home' },
    { label: 'My Reports', path: '/reports', icon: 'analytics' },
    { label: 'Alerts', path: '/alerts', icon: 'notifications' },
    { label: 'Profile', path: '/profile', icon: 'account_circle' },
  ],
  relief_admin: [
    { label: 'Dashboard', path: '/relief/dashboard', icon: 'dashboard' },
    { label: 'Incidents', path: '/relief/incidents', icon: 'crisis_alert' },
    { label: 'Alerts', path: '/relief/alerts', icon: 'campaign' },
    { label: 'Reports', path: '/relief/reports', icon: 'assessment' },
    { label: 'Teams', path: '/relief/teams', icon: 'groups' },
  ],
  field_unit: [
    { label: 'My Mission', path: '/field/mission', icon: 'my_location' },
    { label: 'Incidents', path: '/field/incidents', icon: 'warning' },
    { label: 'Profile', path: '/field/profile', icon: 'account_circle' },
  ],
};

// Incident types for report form
export const INCIDENT_TYPES = ['Congestion', 'Medical', 'Accident'];

// Severity levels
export const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'];

// Status flow steps
export const STATUS_STEPS = ['pending', 'en_route', 'resolved'];
export const STATUS_STEP_LABELS = ['Pending', 'En Route', 'Resolved'];
export const STATUS_STEP_ICONS = ['schedule', 'directions_car', 'task_alt'];
