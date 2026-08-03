import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { getSeverityClass } from '../../utils/severity';
import '../../styles/relief.css';

export default function ActiveIncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    setLoading(true);
    try {
      const data = await api.get('/incidents').catch(() => []);
      const active = (Array.isArray(data) ? data : []).filter((i) =>
        ['pending', 'assigned', 'en_route'].includes(i.status)
      );
      setIncidents(active);
    } catch (err) {
      console.error('ActiveIncidents error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relief-page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 24, letterSpacing: '0.08em', color: 'var(--nt-bright)' }}>
          ACTIVE_INCIDENTS_MONITOR ({incidents.length})
        </h1>
        <button
          onClick={loadIncidents}
          style={{
            padding: '8px 16px',
            background: '#F97316',
            color: '#FFF',
            border: 'none',
            borderRadius: 4,
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          REFRESH
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--nt-dim)', textAlign: 'center', padding: 40 }}>Loading active incidents...</div>
      ) : incidents.length === 0 ? (
        <div style={{ color: 'var(--nt-dim)', textAlign: 'center', padding: 40 }}>No active incidents at this time.</div>
      ) : (
        <table className="incidents-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>TYPE</th>
              <th>SEVERITY</th>
              <th>ZONE / LOCATION</th>
              <th>STATUS</th>
              <th>REPORTED AT</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((inc) => {
              const sevClass = getSeverityClass(inc.severity);
              return (
                <tr key={inc._id}>
                  <td style={{ fontFamily: 'Fira Code, monospace', color: 'var(--nt-dim)' }}>
                    #{inc._id?.slice(-6).toUpperCase()}
                  </td>
                  <td style={{ fontWeight: 600 }}>{inc.type || inc.title}</td>
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
                      {inc.severity || 'normal'}
                    </span>
                  </td>
                  <td>{inc.zone || inc.location?.address || 'Unknown'}</td>
                  <td style={{ textTransform: 'uppercase', color: '#F97316' }}>{inc.status}</td>
                  <td style={{ fontFamily: 'Fira Code, monospace', fontSize: 11, color: 'var(--nt-dim)' }}>
                    {formatDate(inc.createdAt)}
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
