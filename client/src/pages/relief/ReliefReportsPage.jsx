import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';
import { getSeverityClass } from '../../utils/severity';
import '../../styles/relief.css';

export default function ReliefReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await api.get('/incidents').catch(() => []);
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Load reports error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = reports.filter((r) => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = (r.type || r.title || '').toLowerCase().includes(term);
      const matchDesc = (r.description || '').toLowerCase().includes(term);
      const matchZone = (r.zone || '').toLowerCase().includes(term);
      if (!matchTitle && !matchDesc && !matchZone) return false;
    }
    return true;
  });

  return (
    <div className="relief-page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 24, letterSpacing: '0.08em', color: 'var(--nt-bright)' }}>
          ALL_INCIDENT_REPORTS ({reports.length})
        </h1>
        <div className="reports-filters">
          <input
            type="text"
            className="reports-search"
            placeholder="Search incident reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              background: 'var(--nt-card)',
              color: 'var(--nt-bright)',
              border: '1px solid var(--nt-card-border)',
              fontFamily: 'Outfit, sans-serif',
              fontSize: 13,
            }}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="en_route">En Route</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ color: 'var(--nt-dim)', textAlign: 'center', padding: 40 }}>Loading reports...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: 'var(--nt-dim)', textAlign: 'center', padding: 40 }}>No incident reports match your criteria.</div>
      ) : (
        <table className="incidents-table">
          <thead>
            <tr>
              <th>TICKET ID</th>
              <th>TYPE</th>
              <th>SEVERITY</th>
              <th>ZONE / ADDRESS</th>
              <th>STATUS</th>
              <th>REPORTED AT</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const sevClass = getSeverityClass(r.severity);
              return (
                <tr key={r._id}>
                  <td style={{ fontFamily: 'Fira Code, monospace', color: 'var(--nt-dim)' }}>
                    #{r._id?.slice(-6).toUpperCase()}
                  </td>
                  <td style={{ fontWeight: 600 }}>{r.type || r.title}</td>
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
                      {r.severity || 'normal'}
                    </span>
                  </td>
                  <td>{r.zone || r.location?.address || 'Unknown'}</td>
                  <td style={{ textTransform: 'uppercase', color: r.status === 'resolved' ? '#34C759' : '#F97316' }}>
                    {r.status}
                  </td>
                  <td style={{ fontFamily: 'Fira Code, monospace', fontSize: 11, color: 'var(--nt-dim)' }}>
                    {formatDate(r.createdAt)}
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
