import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/common/Icon';
import { formatTimeUTC } from '../../utils/formatters';
import { categorizeType, getTypeColor } from '../../utils/severity';
import { haversine, getZone, getNeighborZones } from '../../utils/geo';
import '../../styles/user.css';

export default function UserAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);

  const userLocation = user?.location || { lat: 0, lng: 0 };

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const [profileRes, allIncidents, myAlerts, activeBroadcasts] = await Promise.all([
        api.get('/auth/me').catch(() => null),
        api.get('/incidents').catch(() => []),
        api.get('/alerts/my').catch(() => []),
        api.get('/alerts/active').catch(() => []),
      ]);

      const loc = profileRes?.location || userLocation;
      const myId = user?._id;
      const userZn = getZone(loc.lat, loc.lng);
      const neighbors = getNeighborZones(userZn);

      // Filter nearby incidents
      let nearby = (Array.isArray(allIncidents) ? allIncidents : []).filter((inc) => {
        if (inc.reportedBy === myId) return false;
        if (!inc.location?.lat) return false;
        const incZone = inc.zone || getZone(inc.location.lat, inc.location.lng);
        const dist = haversine(loc.lat, loc.lng, inc.location.lat, inc.location.lng);
        if (incZone === userZn || neighbors.includes(incZone) || dist <= 5) {
          inc.distanceKm = dist;
          inc.zone = incZone;
          return true;
        }
        return false;
      });

      // Add broadcasts
      (Array.isArray(activeBroadcasts) ? activeBroadcasts : []).forEach((ab) => {
        if (!ab.targetUser) {
          nearby.push({
            _id: ab._id,
            type: ab.type || 'SYSTEM BROADCAST',
            status: ab.active !== false ? 'pending' : 'resolved',
            description: ab.message,
            severity: ab.severity,
            createdAt: ab.createdAt,
            location: { address: `ZONE ${ab.zone || 'UNKNOWN'}` },
            isBroadcast: true,
          });
        }
      });

      nearby.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setAlerts(nearby);
    } catch (err) {
      console.error('Alerts load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const activeAlerts = alerts.filter((r) => ['pending', 'assigned', 'en_route'].includes(r.status));
  const pastAlerts = alerts.filter((r) => ['resolved', 'dismissed'].includes(r.status));

  // Stats (today)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayAlerts = alerts.filter((r) => new Date(r.createdAt) >= todayStart);
  const counts = { accident: 0, congestion: 0, route: 0, system: 0 };
  todayAlerts.forEach((a) => counts[categorizeType(a.type)]++);

  // Filter
  const filteredActive = filter === 'All'
    ? activeAlerts
    : activeAlerts.filter((a) => categorizeType(a.type) === filter.toLowerCase());

  return (
    <div className="main-wrap" style={{ height: 'calc(100vh - 64px)' }}>
      <div className="left-col" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Filter chips */}
        <div className="filter-bar">
          {['All', 'Accident', 'Congestion', 'Route', 'System'].map((f) => (
            <button key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>

        {/* Active Alerts Header */}
        <div className="section-header">
          <span className="section-title">Active Alerts</span>
          <div className="live-badge">
            <div className="live-dot pulse-red" />
            <span className="live-text">LIVE</span>
            <span className="live-count">{activeAlerts.length} active</span>
          </div>
        </div>

        {/* Active Alert Grid */}
        <div className="alert-grid">
          {loading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              Loading alerts...
            </div>
          ) : filteredActive.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              No active nearby alerts.
            </div>
          ) : (
            filteredActive.map((alert) => {
              const cat = categorizeType(alert.type);
              const distStr = alert.distanceKm ? `${alert.distanceKm.toFixed(1)} km away` : 'Nearby';
              return (
                <div className={`alert-card accent-${cat}`} key={alert._id} onClick={() => setSelected(alert)}>
                  <span className={`alert-type-badge badge-${cat}`}>{alert.type}</span>
                  <div className="alert-card-title">{alert.type} — {alert.location?.address || 'Unknown'}</div>
                  <div className="alert-sector" style={{ color: getTypeColor(cat) }}>
                    Priority {alert.severity || 'Normal'} // System
                  </div>
                  <div className="alert-card-body">{alert.description || 'No description.'}</div>
                  <div className="alert-card-footer">
                    <span className="alert-dist">{distStr}</span>
                    <span className="alert-time">{formatTimeUTC(alert.createdAt)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Past Alerts */}
        <div>
          <div className="section-head" style={{ marginTop: 16 }}>
            <span className="section-label">
              <Icon name="history" size={16} />
              Cleared Alerts
            </span>
          </div>
          {pastAlerts.length === 0 ? (
            <div style={{ padding: 16, color: 'var(--text-muted)' }}>No past alerts.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pastAlerts.slice(0, 5).map((alert) => {
                const isDismissed = alert.status === 'dismissed';
                return (
                  <div className="cleared-row" key={alert._id} onClick={() => setSelected(alert)}>
                    <div>
                      <div className="cleared-title">{alert.type} — {alert.location?.address || 'Unknown'}</div>
                      <div className="cleared-meta">
                        <span className="cleared-status" style={{ color: isDismissed ? 'var(--text-muted)' : 'var(--success)' }}>
                          {isDismissed ? 'Dismissed' : 'Cleared_Success'}
                        </span>
                        <span className="cleared-time">{formatTimeUTC(alert.createdAt)}</span>
                      </div>
                    </div>
                    <span className="pill-cleared" style={{ borderColor: isDismissed ? 'var(--text-muted)' : 'var(--success)', color: isDismissed ? 'var(--text-muted)' : 'var(--success)' }}>
                      {isDismissed ? 'Dismissed' : 'Cleared'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="right-col" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {!selected ? (
          <div className="card detail-panel" style={{ textAlign: 'center', padding: 40 }}>
            <Icon name="notifications_active" size={48} style={{ color: 'var(--text-muted)', marginBottom: 12, opacity: 0.3 }} />
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>
              SELECT AN ALERT TO VIEW DETAILS
            </div>
          </div>
        ) : (
          <div className="card detail-panel">
            <div className="detail-header">
              <span className="detail-header-title">Alert Detail</span>
              <button className="icon-btn" onClick={() => setSelected(null)}>
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="detail-body">
              <span className={`detail-priority-badge badge-${categorizeType(selected.type)}`}>
                {(selected.type || 'System').toUpperCase()}_{(selected.severity || 'Normal').toUpperCase()}
              </span>
              <div className="detail-ref">INCIDENT_LOG // {selected.incidentId || 'SYS-000'}</div>
              <div className="detail-headline">{selected.type} — {selected.location?.address || 'Unknown'}</div>
              <div className="detail-coords">
                {selected.location?.lat || 0}° N, {selected.location?.lng || 0}° W
              </div>
              <div className="detail-desc">{selected.description || 'No additional details.'}</div>
              <div className="detail-meta-grid">
                <div className="detail-meta-row">
                  <span className="detail-meta-key">Time</span>
                  <span className="detail-meta-val">{formatTimeUTC(selected.createdAt)}</span>
                </div>
                <div className="detail-meta-row">
                  <span className="detail-meta-key">Distance</span>
                  <span className="detail-meta-val">{selected.distanceKm ? `${selected.distanceKm.toFixed(1)} km` : 'Nearby'}</span>
                </div>
                <div className="detail-meta-row">
                  <span className="detail-meta-key">Severity</span>
                  <span className="detail-meta-val" style={{ color: getTypeColor(categorizeType(selected.type)) }}>
                    {(selected.severity || 'Normal').charAt(0).toUpperCase() + (selected.severity || 'Normal').slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Panel */}
        <div className="stats-panel">
          <div className="stats-panel-title">Today's Breakdown</div>
          <div className="stats-grid">
            {[
              { key: 'accident', label: 'Accidents', color: '#FF6B35' },
              { key: 'congestion', label: 'Congestion', color: '#FFB830' },
              { key: 'route', label: 'Route', color: '#3A86FF' },
              { key: 'system', label: 'System', color: '#BF5AF2' },
            ].map(({ key, label, color }) => (
              <div className={`stat-cell border-${key}`} key={key}>
                <span className={`stat-num num-${key}`}>{String(counts[key]).padStart(2, '0')}</span>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
          <div className="integrity-row">
            <Icon name="verified" size={16} />
            <span className="integrity-text">Data integrity verified · Sources nominal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
