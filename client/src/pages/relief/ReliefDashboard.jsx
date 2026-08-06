import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import socketManager from '../../services/socket';
import IncidentQueue from '../../components/relief/IncidentQueue';
import IncidentDetailPanel from '../../components/relief/IncidentDetailPanel';
import ZoneHeatmap from '../../components/relief/ZoneHeatmap';
import OperationalMap from '../../components/relief/OperationalMap';
import { formatTimeUTC } from '../../utils/formatters';
import '../../styles/relief.css';

export default function ReliefDashboard() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [messages, setMessages] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [zoneAnalytics, setZoneAnalytics] = useState(null);
  const [mapIncidents, setMapIncidents] = useState([]);
  const [reliefCenter, setReliefCenter] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await api.get('/incidents/relief-dashboard');
      if (data) {
        const queueList = Array.isArray(data.queue) ? data.queue : [];
        setIncidents(queueList);
        setActiveCount(data.activeCount ?? 0);
        setCriticalCount(data.criticalCount ?? 0);
        setZoneAnalytics(data.zoneAnalytics || null);
        setMapIncidents(Array.isArray(data.mapIncidents) ? data.mapIncidents : []);
        setAlerts(Array.isArray(data.broadcasts) ? data.broadcasts : []);
        if (data.reliefCenter) {
          setReliefCenter(data.reliefCenter);
        }

        if (!selectedId && queueList.length > 0) {
          setSelectedId(queueList[0]._id);
        }
      }
    } catch (err) {
      console.error('ReliefDashboard load error:', err);
    }
  }, [selectedId]);

  useEffect(() => {
    loadData();

    // Periodic auto-refresh every 30 seconds to drop > 1 hour old queue items
    const autoTimer = setInterval(loadData, 30000);

    // Listen for real-time socket updates
    socketManager.on('incident:updated', loadData);
    socketManager.on('incident:new', loadData);

    return () => {
      clearInterval(autoTimer);
      socketManager.off('incident:updated', loadData);
      socketManager.off('incident:new', loadData);
    };
  }, [loadData]);

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
    if (actionLoading) return;
    setActionLoading(true);
    try {
      if (newStatus === 'dismissed') {
        await api.patch(`/incidents/${incId}/dismiss`, { dismissReason: 'False Alarm' });
      } else {
        await api.patch(`/incidents/${incId}/status`, { status: newStatus });
      }
      await loadData();
    } catch (err) {
      console.error('Update status error:', err);
    } finally {
      setActionLoading(false);
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

  return (
    <main className="relief-main">
      {/* Left Column - Incident Queue (1-hr logs) */}
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
          <ZoneHeatmap customData={zoneAnalytics} />
        </div>

        {/* Mini Operational Map View */}
        <div>
          <OperationalMap customIncidents={mapIncidents} customCenter={reliefCenter?.location} />
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span className="relief-alert-type" style={{ color: al.severity === 'critical' ? '#FF3B30' : '#F97316' }}>
                      {al.type} // {al.zone || 'All Zones'}
                    </span>
                    <span style={{ fontSize: 9, fontFamily: 'Fira Code, monospace', color: '#22C55E', padding: '1px 4px', background: 'rgba(34,197,94,0.15)', borderRadius: 3 }}>
                      {al.status || 'Delivered'}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'Fira Code, monospace', fontSize: 10, color: 'var(--accent, #F97316)', marginBottom: 2 }}>
                    ID: {al.broadcastId}
                  </div>
                  <div className="relief-alert-msg">{al.message}</div>
                  <div className="relief-alert-time" style={{ marginTop: 4 }}>{formatTimeUTC(al.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
