import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatDate, formatLocation } from '../../utils/formatters';
import { getSeverityClass } from '../../utils/severity';
import '../../styles/field.css';

export default function FieldMissions() {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    setLoading(true);
    try {
      const data = await api.get('/incidents').catch(() => []);
      setMissions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('FieldMissions load error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, overflowY: 'auto' }}>
      <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 24, letterSpacing: '0.08em', color: 'var(--nt-bright)', marginBottom: 20 }}>
        MISSION_LOG_ARCHIVE ({missions.length})
      </h1>

      {loading ? (
        <div style={{ color: 'var(--nt-dim)', textAlign: 'center', padding: 40 }}>Loading mission logs...</div>
      ) : missions.length === 0 ? (
        <div style={{ color: 'var(--nt-dim)', textAlign: 'center', padding: 40 }}>No mission archives found.</div>
      ) : (
        <table className="incidents-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>TYPE</th>
              <th>SEVERITY</th>
              <th>SECTOR / ZONE</th>
              <th>STATUS</th>
              <th>TIMESTAMP</th>
            </tr>
          </thead>
          <tbody>
            {missions.map((m) => {
              const sevClass = getSeverityClass(m.severity);
              return (
                <tr key={m._id}>
                  <td style={{ fontFamily: 'Fira Code, monospace', color: 'var(--nt-dim)' }}>
                    #{m.incidentId || m._id}
                  </td>
                  <td style={{ fontWeight: 600 }}>{m.type || m.title}</td>
                  <td>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontFamily: 'Fira Code, monospace',
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: sevClass === 'critical' ? 'rgba(255,59,48,0.15)' : 'rgba(255,149,0,0.15)',
                        color: sevClass === 'critical' ? '#FF3B30' : '#FF9500',
                      }}
                    >
                      {m.severity || 'normal'}
                    </span>
                  </td>
                  <td>{m.zone || formatLocation(m.location)}</td>
                  <td style={{ textTransform: 'uppercase', color: m.status === 'resolved' ? '#34C759' : '#F97316' }}>
                    {m.status}
                  </td>
                  <td style={{ fontFamily: 'Fira Code, monospace', fontSize: 11, color: 'var(--nt-dim)' }}>
                    {formatDate(m.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
