import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import socketManager from '../../services/socket';
import Icon from '../../components/common/Icon';
import ToggleSwitch from '../../components/common/ToggleSwitch';
import '../../styles/user.css';

export default function UserProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, resolved: 0, active: 0, dismissed: 0 });
  const [settings, setSettings] = useState({
    proximity: true,
    statusUpdates: true,
    broadcasts: true,
    locationTracking: true,
  });

  const loadStats = useCallback(async () => {
    try {
      const reports = await api.get('/incidents?reportedBy=me');
      const list = Array.isArray(reports) ? reports : [];
      setStats({
        total: list.length,
        resolved: list.filter((r) => r.status === 'resolved').length,
        active: list.filter((r) => ['pending', 'en_route', 'dispatched'].includes(r.status)).length,
        dismissed: list.filter((r) => r.status === 'dismissed').length,
      });
    } catch (err) {
      console.error('Stats error:', err);
    }
  }, []);

  useEffect(() => {
    loadStats();

    socketManager.on('incident:updated', loadStats);
    socketManager.on('incident:new', loadStats);

    return () => {
      socketManager.off('incident:updated', loadStats);
      socketManager.off('incident:new', loadStats);
    };
  }, [loadStats]);

  const initials = user?.name
    ? user.name.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const shortId = user?._id
    ? user._id.substring(user._id.length - 6).toUpperCase()
    : '000000';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSetting = (key) => () => {
    setSettings((s) => ({ ...s, [key]: !s[key] }));
  };

  return (
    <div className="profile-layout">
      {/* Left: Identity Card */}
      <div className="left-col" style={{ gap: 16, display: 'flex', flexDirection: 'column' }}>
        <div className="card identity-card">
          <div className="avatar-large">{initials}</div>
          <div className="user-name">{user?.name || 'Unknown User'}</div>
          <div className="user-id">USER_ID // NX-{shortId}</div>
          <div className="user-location">
            <Icon name="location_on" size={14} />
            {user?.location?.lat ? `${user.location.lat.toFixed(4)}°N, ${user.location.lng.toFixed(4)}°E` : 'No location'}
          </div>
          <div className="status-badge-profile">Active</div>
        </div>

        {/* Stats */}
        <div className="stats-grid profile">
          <div className="card stat-card">
            <div className="stat-label">Reports Filed</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Reports Resolved</div>
            <div className="stat-value">{stats.resolved}</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Active Reports</div>
            <div className="stat-value">{stats.active}</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">False Alarms</div>
            <div className="stat-value">{stats.dismissed}</div>
          </div>
        </div>
      </div>

      {/* Right: Settings */}
      <div className="right-col" style={{ gap: 24, display: 'flex', flexDirection: 'column' }}>
        {/* Notification Settings */}
        <div className="settings-section">
          <h3 className="settings-title">
            <Icon name="notifications" />
            Notification Preferences
          </h3>
          <div className="card settings-list">
            <ToggleSwitch label="Proximity Alerts" active={settings.proximity} onToggle={toggleSetting('proximity')} />
            <ToggleSwitch label="Status Updates" active={settings.statusUpdates} onToggle={toggleSetting('statusUpdates')} />
            <ToggleSwitch label="System Broadcasts" active={settings.broadcasts} onToggle={toggleSetting('broadcasts')} />
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="settings-section">
          <h3 className="settings-title">
            <Icon name="shield" />
            Privacy & Location
          </h3>
          <div className="card settings-list">
            <ToggleSwitch label="Location Tracking" active={settings.locationTracking} onToggle={toggleSetting('locationTracking')} />
            <div className="settings-link">
              <span style={{ fontSize: 14, fontWeight: 500 }}>Data Export</span>
              <Icon name="chevron_right" className="link-arrow" />
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="danger-zone">
          <div className="danger-title">Danger Zone</div>
          <button className="btn btn-danger" onClick={handleLogout}>
            <Icon name="logout" size={16} />
            Sign Out
          </button>
          <div className="delete-link">
            <a href="#">Delete Account</a>
          </div>
        </div>
      </div>
    </div>
  );
}
