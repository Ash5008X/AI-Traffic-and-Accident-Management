import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import IncidentQueue from '../../components/relief/IncidentQueue';
import IncidentDetailPanel from '../../components/relief/IncidentDetailPanel';
import ZoneHeatmap from '../../components/relief/ZoneHeatmap';
import { formatTimeUTC } from '../../utils/formatters';
import { getZone } from '../../utils/geo';
import '../../styles/relief.css';

export default function ReliefDashboard() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [messages, setMessages] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    loadData();
    const id = setInterval(loadData, 10000);
    return () => clearInterval(id);
  }, []);

  const loadData = async () => {
    try {
      const [incRes, alertsRes] = await Promise.all([
        api.get('/incidents').catch(() => []),
        api.get('/alerts').catch(() => []),
      ]);

      const incList = Array.isArray(incRes) ? incRes : [];
      // Annotate zone if not present
      incList.forEach((inc) => {
        if (!inc.zone && inc.location?.lat) {
          inc.zone = getZone(inc.location.lat, inc.location.lng);
        }
      });
      incList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setIncidents(incList);
      if (!selectedId && incList.length > 0) {
        setSelectedId(incList[0]._id);
      }

      const alertList = Array.isArray(alertsRes) ? alertsRes : [];
      setAlerts(alertList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4));
    } catch (err) {
      console.error('ReliefDashboard load error:', err);
    }
  };

  const selectedIncident = incidents.find((i) => i._id === selectedId) || null;

  useEffect(() => {
    if (selectedId) {
      loadMessages(selectedId);
    }
  }, [selectedId]);

  const loadMessages = async (incId) => {
    try {
      const msgs = await api.get(`/messages?incidentId=${incId}`).catch(() => []);
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (err) {
      console.error('Messages load error:', err);
    }
  };

  const handleUpdateStatus = async (incId, newStatus) => {
    try {
      await api.patch(`/incidents/${incId}`, { status: newStatus });
      await loadData();
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  const handleSendMessage = async (incId, content) => {
    try {
      await api.post('/messages', {
        incidentId: incId,
        content,
        senderRole: 'relief_admin',
        senderName: user?.name || 'Relief Command',
      });
      await loadMessages(incId);
    } catch (err) {
      console.error('Send message error:', err);
    }
  };

  const activeCount = incidents.filter((i) => ['pending', 'assigned', 'en_route'].includes(i.status)).length;
  const criticalCount = incidents.filter((i) => i.severity === 'critical').length;

  return (
    <main className="relief-main">
      {/* Left Column - Incident Queue */}
      <IncidentQueue
        incidents={incidents}
        selectedId={selectedId}
        onSelect={(inc) => setSelectedId(inc._id)}
        filter={filter}
        onFilterChange={setFilter}
      />

      {/* Center Column - Detail & Chat */}
      <IncidentDetailPanel
        incident={selectedIncident}
        onUpdateStatus={handleUpdateStatus}
        onSendMessage={handleSendMessage}
        messages={messages}
      />

      {/* Right Column - Heatmap, Stats & Alerts */}
      <div className="relief-col-right" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Stat Chips */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div className="stat-chip">
            <span className="stat-chip-label">ACTIVE</span>
            <span className="stat-chip-value" style={{ color: '#F97316' }}>
              {String(activeCount).padStart(2, '0')}
            </span>
          </div>
          <div className="stat-chip">
            <span className="stat-chip-label">CRITICAL</span>
            <span className="stat-chip-value" style={{ color: '#FF3B30' }}>
              {String(criticalCount).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Zone Heatmap */}
        <div>
          <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '14px', letterSpacing: '0.08em', color: 'var(--nt-bright)', marginBottom: '12px', textTransform: 'uppercase' }}>
            SECTOR HEATMAP // DENSITY
          </h3>
          <ZoneHeatmap incidents={incidents} />
        </div>

        {/* Mini Map */}
        <div className="mini-map">
          <span className="mini-map-label">MAP_VIEW // SECTOR_SUMMARY</span>
          <div style={{ color: 'var(--nt-dim)', fontSize: '13px', fontFamily: 'Outfit, sans-serif' }}>
            Geospatial Grid Nominal ({incidents.length} pinned)
          </div>
        </div>

        {/* System Broadcasts & Alert Feed */}
        <div>
          <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: '14px', letterSpacing: '0.08em', color: 'var(--nt-bright)', marginBottom: '12px', textTransform: 'uppercase' }}>
            REAL-TIME ALERT BROADCASTS
          </h3>
          <div>
            {alerts.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--nt-dim)' }}>No recent broadcasts.</div>
            ) : (
              alerts.map((al) => (
                <div className="relief-alert-card" key={al._id}>
                  <div className="relief-alert-type" style={{ color: al.severity === 'critical' ? '#FF3B30' : '#F97316' }}>
                    {al.type || 'SYSTEM'} // {al.severity?.toUpperCase() || 'NORMAL'}
                  </div>
                  <div className="relief-alert-msg">{al.message || al.description || 'No message.'}</div>
                  <div className="relief-alert-time">{formatTimeUTC(al.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
