import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';
import FormMessage from '../../components/common/FormMessage';
import '../../styles/relief.css';

const SEVERITY_COLORS = {
  critical: '#FF3B30',
  warning: '#F97316',
  info: '#38BDF8',
};

const SEVERITY_LABELS = {
  critical: 'CRITICAL',
  warning: 'WARNING',
  info: 'INFO',
};

export default function ReliefAlertsPage() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [form, setForm] = useState({
    title: '',
    type: 'ALERT BROADCAST',
    severity: 'warning',
    zone: 'All Zones',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadBroadcasts();
  }, []);

  const loadBroadcasts = async () => {
    try {
      const data = await api.get('/alerts/history');
      setBroadcasts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Load broadcasts error:', err);
      setBroadcasts([]);
    }
  };

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleBroadcast = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
    if (!form.message.trim()) return;
    setLoading(true);
    try {
      const newAlert = await api.post('/alerts', {
        title: form.title,
        type: form.type,
        severity: form.severity,
        zone: form.zone,
        message: form.message,
      });
      setMsg(`Broadcast transmitted successfully. ID: ${newAlert.broadcastId}`);
      setForm({ title: '', type: 'ALERT BROADCAST', severity: 'warning', zone: 'All Zones', message: '' });

      // Fetch fresh broadcast history directly from MongoDB
      await loadBroadcasts();
    } catch (err) {
      setError(err.message || 'Failed to broadcast alert.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relief-page-content">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left: Composer */}
        <div className="alert-composer">
          <h3>TRANSMIT_SYSTEM_BROADCAST</h3>
          <form onSubmit={handleBroadcast}>
            <div className="composer-field">
              <label className="composer-label">BROADCAST TITLE</label>
              <input
                className="composer-input"
                type="text"
                placeholder="Enter broadcast title..."
                value={form.title}
                onChange={update('title')}
              />
            </div>

            <div className="composer-field">
              <label className="composer-label">BROADCAST TYPE</label>
              <select className="composer-input" value={form.type} onChange={update('type')}>
                <option value="ALERT BROADCAST">ALERT BROADCAST</option>
                <option value="TRAFFIC WARNING">TRAFFIC WARNING</option>
                <option value="SAFETY DIRECTIVE">SAFETY DIRECTIVE</option>
                <option value="EMERGENCY ORDER">EMERGENCY ORDER</option>
              </select>
            </div>

            <div className="composer-field">
              <label className="composer-label">SEVERITY LEVEL</label>
              <select className="composer-input" value={form.severity} onChange={update('severity')}>
                <option value="info">INFO (Standard)</option>
                <option value="warning">WARNING (Elevated)</option>
                <option value="critical">CRITICAL (Emergency)</option>
              </select>
            </div>

            <div className="composer-field">
              <label className="composer-label">TARGET ZONE</label>
              <select className="composer-input" value={form.zone} onChange={update('zone')}>
                <option value="All Zones">All Zones</option>
                <option value="Zone A">Zone A</option>
                <option value="Zone B">Zone B</option>
                <option value="Zone C">Zone C</option>
                <option value="Zone D">Zone D</option>
                <option value="Zone E">Zone E</option>
                <option value="Zone F">Zone F</option>
              </select>
            </div>

            <div className="composer-field">
              <label className="composer-label">TRANSMISSION MESSAGE</label>
              <textarea
                className="composer-input"
                placeholder="Enter alert broadcast message..."
                value={form.message}
                onChange={update('message')}
                required
              />
            </div>

            <button type="submit" className="composer-submit" disabled={loading}>
              {loading ? 'TRANSMITTING...' : 'BROADCAST ALERT NOW'}
            </button>
            <FormMessage message={error} isError />
            <FormMessage message={msg} isError={false} />
          </form>
        </div>

        {/* Right: Broadcast History */}
        <div>
          <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 16, letterSpacing: '0.08em', color: 'var(--nt-bright)', marginBottom: 16 }}>
            BROADCAST_TRANSMISSION_HISTORY ({broadcasts.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {broadcasts.length === 0 ? (
              <div style={{ color: 'var(--nt-dim)', fontSize: 13, padding: '20px 0' }}>
                No broadcasts have been transmitted yet.
              </div>
            ) : (
              broadcasts.map((al) => (
                <div className="relief-alert-card" key={al._id}>
                  {/* Top row: Type, Severity label, Status badge & Time */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        className="relief-alert-type"
                        style={{ color: SEVERITY_COLORS[al.severity] || '#F97316' }}
                      >
                        {al.type} // {SEVERITY_LABELS[al.severity] || String(al.severity).toUpperCase()}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: 'rgba(34, 197, 94, 0.15)',
                          color: '#22C55E',
                          border: '1px solid rgba(34, 197, 94, 0.3)',
                          fontFamily: "'Fira Code', monospace",
                          textTransform: 'uppercase',
                        }}
                      >
                        {al.status}
                      </span>
                    </div>
                    <span className="relief-alert-time">{formatDate(al.createdAt)}</span>
                  </div>

                  {/* ID & Target Zone */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 12, fontWeight: 700, color: 'var(--accent, #F97316)' }}>
                      Broadcast ID: {al.broadcastId}
                    </div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, fontWeight: 700, color: 'var(--nt-bright)', letterSpacing: '0.04em' }}>
                      Target: <span style={{ color: '#38BDF8' }}>{al.targetZone || al.zone || 'Unknown'}</span>
                    </div>
                  </div>

                  {/* Title if present */}
                  {al.title && (
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600, color: 'var(--nt-bright)', marginBottom: 4 }}>
                      {al.title}
                    </div>
                  )}

                  {/* Message */}
                  <div className="relief-alert-msg" style={{ marginTop: 4, marginBottom: 8, whiteSpace: 'pre-wrap' }}>
                    {al.message}
                  </div>

                  {/* Footer: Recipients info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 11, color: 'var(--nt-dim)' }}>
                      Recipients: <span style={{ fontWeight: 600, color: 'var(--nt-bright)' }}>{al.recipientCount}</span>
                    </span>
                    <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 10, color: 'var(--nt-dim)' }}>
                      {al.createdBy || al.broadcastBy ? 'Relief Command' : 'System'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
