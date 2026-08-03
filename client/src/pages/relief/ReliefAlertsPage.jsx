import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatTimeUTC } from '../../utils/formatters';
import FormMessage from '../../components/common/FormMessage';
import '../../styles/relief.css';

export default function ReliefAlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [form, setForm] = useState({
    type: 'ALERT BROADCAST',
    severity: 'warning',
    zone: 'ALL SECTORS',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await api.get('/alerts').catch(() => []);
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Load alerts error:', err);
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
      await api.post('/alerts', {
        type: form.type,
        severity: form.severity,
        zone: form.zone,
        message: form.message,
        active: true,
      });
      setMsg('Alert broadcasted successfully across all units.');
      setForm({ type: 'ALERT BROADCAST', severity: 'warning', zone: 'ALL SECTORS', message: '' });
      await loadAlerts();
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
              <label className="composer-label">TARGET SECTOR / ZONE</label>
              <select className="composer-input" value={form.zone} onChange={update('zone')}>
                <option value="ALL SECTORS">ALL SECTORS (Global)</option>
                <option value="SECTOR-N">SECTOR-N</option>
                <option value="SECTOR-S">SECTOR-S</option>
                <option value="SECTOR-E">SECTOR-E</option>
                <option value="SECTOR-W">SECTOR-W</option>
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

        {/* Right: Broadcast Log */}
        <div>
          <h3 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 16, letterSpacing: '0.08em', color: 'var(--nt-bright)', marginBottom: 16 }}>
            BROADCAST_TRANSMISSION_HISTORY ({alerts.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {alerts.length === 0 ? (
              <div style={{ color: 'var(--nt-dim)', fontSize: 13 }}>No system broadcasts transmitted yet.</div>
            ) : (
              alerts.map((al) => (
                <div className="relief-alert-card" key={al._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span className="relief-alert-type" style={{ color: al.severity === 'critical' ? '#FF3B30' : '#F97316' }}>
                      {al.type} // {al.zone || 'ALL SECTORS'}
                    </span>
                    <span className="relief-alert-time">{formatTimeUTC(al.createdAt)}</span>
                  </div>
                  <div className="relief-alert-msg">{al.message || al.description}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
