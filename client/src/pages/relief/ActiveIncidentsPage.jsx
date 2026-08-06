import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import CommandCenterMap from '../../components/relief/CommandCenterMap';
import Icon from '../../components/common/Icon';
import { formatDate, formatLocation, formatZone } from '../../utils/formatters';
import { getSeverityClass } from '../../utils/severity';
import '../../styles/relief.css';

const ALL_ZONES = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'Zone F'];

export default function ActiveIncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [mapIncidents, setMapIncidents] = useState([]);
  const [reliefCenter, setReliefCenter] = useState(null);
  const [zoneStats, setZoneStats] = useState({
    'Zone A': { active: 0, resolved: 0 },
    'Zone B': { active: 0, resolved: 0 },
    'Zone C': { active: 0, resolved: 0 },
    'Zone D': { active: 0, resolved: 0 },
    'Zone E': { active: 0, resolved: 0 },
    'Zone F': { active: 0, resolved: 0 },
  });
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch 24-hour incidents and zone analytics from backend endpoint GET /api/incidents/relief-incidents
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/incidents/relief-incidents');
      if (data) {
        const list = Array.isArray(data.incidents) ? data.incidents : [];
        setIncidents(list);
        setMapIncidents(Array.isArray(data.mapIncidents) ? data.mapIncidents : list);
        if (data.reliefCenter) {
          setReliefCenter(data.reliefCenter);
        }

        if (data.zoneAnalytics && typeof data.zoneAnalytics === 'object') {
          setZoneStats((prev) => ({
            ...prev,
            ...data.zoneAnalytics,
          }));
        }

        if (list.length > 0 && !selectedIncident) {
          setSelectedIncident(list[0]);
        }
      }
    } catch (err) {
      console.error('[IncidentsCommandCenter] Error loading page data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedIncident]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered incidents for search query (operating on backend MongoDB data)
  const filteredIncidents = incidents.filter((inc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const id = (inc.incidentId || inc._id || '').toLowerCase();
    const type = (inc.type || inc.title || '').toLowerCase();
    const zone = (inc.zone || inc.assignedZone || '').toLowerCase();
    const status = (inc.status || '').toLowerCase();
    return id.includes(q) || type.includes(q) || zone.includes(q) || status.includes(q);
  });

  // Calculate zone with highest active incidents
  const highestActiveZone = ALL_ZONES.reduce((maxZone, z) => {
    const count = zoneStats[z]?.active || 0;
    const maxCount = zoneStats[maxZone]?.active || 0;
    return count > maxCount ? z : maxZone;
  }, 'Zone A');

  return (
    <div className="incidents-cmd-center">
      {/* ── LEFT PANEL: INCIDENT LIST ── */}
      <div className="incidents-cmd-left">
        <div className="queue-header">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="queue-title">INCIDENTS COMMAND CENTER</span>
            <span style={{ fontFamily: 'Fira Code, monospace', fontSize: 10, color: 'var(--nt-dim)', marginTop: 2 }}>
              LAST 24 HOURS // TOTAL: {incidents.length}
            </span>
          </div>
          <button
            onClick={loadData}
            title="Refresh Data"
            style={{
              background: 'transparent',
              border: '1px solid rgba(249,115,22,0.4)',
              color: '#F97316',
              borderRadius: 4,
              padding: '4px 8px',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Icon name="refresh" size={14} />
            REFRESH
          </button>
        </div>

        {/* Search bar */}
        <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(31,52,72,0.3)', background: 'var(--nt-nav-bg)' }}>
          <input
            type="text"
            placeholder="Search by ID, type, zone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 12px',
              borderRadius: 4,
              border: '1px solid var(--nt-card-border)',
              background: 'var(--nt-card)',
              color: 'var(--nt-bright)',
              fontSize: 12,
              fontFamily: 'Outfit, sans-serif',
              outline: 'none',
            }}
          />
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ color: 'var(--nt-dim)', textAlign: 'center', padding: 32, fontSize: 13 }}>
              Loading 24-hr command logs...
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div style={{ color: 'var(--nt-dim)', textAlign: 'center', padding: 32, fontSize: 13 }}>
              No incidents reported in the last 24 hours.
            </div>
          ) : (
            filteredIncidents.map((inc) => {
              const isSelected = selectedIncident?._id === inc._id;
              const isResolved = ['resolved', 'dismissed'].includes(inc.status);
              const sevClass = getSeverityClass(inc.severity);

              return (
                <div
                  key={inc._id}
                  className={`cmd-card-item ${isSelected ? 'selected' : ''} ${isResolved ? 'resolved-subdued' : ''}`}
                  onClick={() => setSelectedIncident(inc)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'Fira Code, monospace', fontSize: 10, color: 'var(--nt-dim)' }}>
                      #{inc.incidentId || inc._id?.slice(-6).toUpperCase()}
                    </span>
                    <span style={{ fontFamily: 'Fira Code, monospace', fontSize: 9, color: 'var(--nt-dim)' }}>
                      {formatDate(inc.createdAt)}
                    </span>
                  </div>

                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--nt-bright)', marginBottom: 6 }}>
                    {inc.type || inc.title || 'Incident Report'}
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
                    {/* Severity Badge */}
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: 3,
                        fontFamily: 'Fira Code, monospace',
                        fontSize: 9,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        background: isResolved
                          ? 'rgba(148,163,184,0.12)'
                          : sevClass === 'critical'
                          ? 'rgba(255,59,48,0.15)'
                          : 'rgba(255,149,0,0.15)',
                        color: isResolved
                          ? '#94A3B8'
                          : sevClass === 'critical'
                          ? '#FF3B30'
                          : '#FF9500',
                        border: `1px solid ${isResolved ? '#64748B' : sevClass === 'critical' ? '#FF3B30' : '#FF9500'}`,
                      }}
                    >
                      {inc.severity || 'NORMAL'}
                    </span>

                    {/* Status Badge */}
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: 3,
                        fontFamily: 'Fira Code, monospace',
                        fontSize: 9,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        background: isResolved ? 'rgba(148,163,184,0.15)' : 'rgba(249,115,22,0.15)',
                        color: isResolved ? '#94A3B8' : '#F97316',
                      }}
                    >
                      {inc.status === 'dismissed' ? 'DISMISSED' : inc.status === 'dispatched' ? 'EN ROUTE' : (inc.status || 'PENDING').toUpperCase()}
                    </span>

                    {/* Zone Badge */}
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 11, color: '#38BDF8', marginLeft: 'auto' }}>
                      {formatZone(inc.zone || inc.assignedZone)}
                    </span>
                  </div>

                  <div style={{ fontFamily: 'Fira Code, monospace', fontSize: 10, color: 'var(--nt-dim)' }}>
                    {formatLocation(inc.location)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── CENTER PANEL: INCIDENT MAP ── */}
      <div className="incidents-cmd-center-col">
        <CommandCenterMap
          incidents={mapIncidents}
          selectedIncident={selectedIncident}
          onSelectIncident={(inc) => setSelectedIncident(inc)}
          customCenter={reliefCenter?.location}
        />
      </div>

      {/* ── RIGHT PANEL: ZONE ANALYTICS ── */}
      <div className="incidents-cmd-right">
        <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 15, letterSpacing: '0.08em', color: 'var(--nt-bright)', marginBottom: 14, textTransform: 'uppercase' }}>
          ZONE ANALYTICS // 24-HR SUMMARY
        </h3>

        <div>
          {ALL_ZONES.map((z) => {
            const stats = zoneStats[z] || { active: 0, resolved: 0 };
            const isHighest = stats.active > 0 && z === highestActiveZone;
            const isSelectedZone = formatZone(selectedIncident?.zone || selectedIncident?.assignedZone) === z;

            return (
              <div
                key={z}
                className={`zone-analytics-card ${isHighest ? 'highest-active' : ''} ${isSelectedZone ? 'selected-zone' : ''}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 15, color: isSelectedZone ? '#F97316' : 'var(--nt-bright)' }}>
                    {z}
                  </span>
                  {isHighest && (
                    <span style={{ fontFamily: 'Fira Code, monospace', fontSize: 9, fontWeight: 700, color: '#FF3B30', background: 'rgba(255,59,48,0.15)', padding: '1px 6px', borderRadius: 3 }}>
                      HIGHEST DENSITY
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {/* Active Stat */}
                  <div style={{ background: 'rgba(11, 19, 32, 0.4)', padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 10, fontWeight: 700, color: 'var(--nt-dim)', textTransform: 'uppercase' }}>
                      ACTIVE
                    </div>
                    <div style={{ fontFamily: 'Fira Code, monospace', fontSize: 20, fontWeight: 700, color: stats.active > 0 ? '#F97316' : 'var(--nt-bright)', marginTop: 2 }}>
                      {stats.active}
                    </div>
                  </div>

                  {/* Resolved Stat */}
                  <div style={{ background: 'rgba(11, 19, 32, 0.4)', padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 10, fontWeight: 700, color: 'var(--nt-dim)', textTransform: 'uppercase' }}>
                      RESOLVED
                    </div>
                    <div style={{ fontFamily: 'Fira Code, monospace', fontSize: 20, fontWeight: 700, color: '#34C759', marginTop: 2 }}>
                      {stats.resolved}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
