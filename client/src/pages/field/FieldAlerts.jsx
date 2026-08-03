import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatTimeUTC } from '../../utils/formatters';
import '../../styles/field.css';

export default function FieldAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.get('/alerts').catch(() => []);
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('FieldAlerts load error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, overflowY: 'auto' }}>
      <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 24, letterSpacing: '0.08em', color: 'var(--nt-bright)', marginBottom: 20 }}>
        TACTICAL_BROADCAST_FEED ({alerts.length})
      </h1>

      {loading ? (
        <div style={{ color: 'var(--nt-dim)', textAlign: 'center', padding: 40 }}>Loading tactical broadcasts...</div>
      ) : alerts.length === 0 ? (
        <div style={{ color: 'var(--nt-dim)', textAlign: 'center', padding: 40 }}>No tactical broadcasts active.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {alerts.map((al) => (
            <div
              key={al._id}
              style={{
                padding: 16,
                borderRadius: 8,
                background: 'var(--nt-card)',
                border: '1px solid var(--nt-card-border)',
                borderLeft: '4px solid #FF3B30',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 13, letterSpacing: '0.06em', color: '#FF3B30' }}>
                  {al.type} // {al.zone || 'ALL SECTORS'}
                </span>
                <span style={{ fontFamily: 'Fira Code, monospace', fontSize: 11, color: 'var(--nt-dim)' }}>
                  {formatTimeUTC(al.createdAt)}
                </span>
              </div>
              <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 14, color: 'var(--nt-bright)' }}>
                {al.message || al.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
