import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatDate, formatLocation } from '../../utils/formatters';
import { getSeverityClass } from '../../utils/severity';
import Icon from '../../components/common/Icon';
import { API_BASE, AUTH_KEY } from '../../utils/constants';
import '../../styles/relief.css';

export default function ReliefReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Left Panel State (Report Export & Download)
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedZone, setSelectedZone] = useState('All Zones');
  const [selectedSeverity, setSelectedSeverity] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedFileType, setSelectedFileType] = useState('CSV (.csv)');

  // Right Panel / Top Filter Toolbar State
  const [tableDate, setTableDate] = useState('');
  const [tableSeverity, setTableSeverity] = useState('All');
  const [tableZone, setTableZone] = useState('All Zones');
  const [tableStatus, setTableStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Trigger report file download from backend API
  const handleDownloadReport = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const params = new URLSearchParams();
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      if (selectedZone && selectedZone !== 'All Zones') params.append('zone', selectedZone);
      if (selectedSeverity && selectedSeverity !== 'All') params.append('severity', selectedSeverity);
      if (selectedStatus && selectedStatus !== 'All') params.append('status', selectedStatus);

      let ext = 'csv';
      if (selectedFileType.includes('PDF')) ext = 'pdf';
      else if (selectedFileType.includes('Excel')) ext = 'xlsx';
      params.append('format', ext);

      let token = null;
      try {
        const raw = localStorage.getItem(AUTH_KEY);
        token = raw ? JSON.parse(raw)?.token : null;
      } catch (e) {}

      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(`${API_BASE}/reports/download?${params.toString()}`, { headers });
      if (!response.ok) {
        throw new Error('Failed to generate report export');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const today = new Date().toISOString().split('T')[0];
      a.download = `incident-report-${today}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download report error:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    console.log('Search submitted:', searchQuery);
  };

  // In-memory filtered reports matching top toolbar controls
  const filtered = reports.filter((r) => {
    if (tableStatus !== 'All') {
      const normStatus = tableStatus.toLowerCase().replace(' ', '_');
      if ((r.status || '').toLowerCase() !== normStatus) return false;
    }
    if (tableSeverity !== 'All') {
      if ((r.severity || '').toLowerCase() !== tableSeverity.toLowerCase()) return false;
    }
    if (tableZone !== 'All Zones') {
      if ((r.zone || '').toLowerCase() !== tableZone.toLowerCase()) return false;
    }
    if (tableDate) {
      const rDate = r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '';
      if (rDate !== tableDate) return false;
    }
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      const matchId = (r.incidentId || r._id || '').toLowerCase().includes(term);
      const matchTitle = (r.type || r.title || '').toLowerCase().includes(term);
      const matchDesc = (r.description || '').toLowerCase().includes(term);
      const matchZone = (r.zone || '').toLowerCase().includes(term);
      if (!matchId && !matchTitle && !matchDesc && !matchZone) return false;
    }
    return true;
  });

  return (
    <div className="relief-page-content reports-view">
      <div className="reports-page-container">
        {/* ── LEFT PANEL: REPORT EXPORT & DOWNLOAD FILTERS ── */}
        <div className="reports-left-panel">
          <div className="reports-export-card">
            <h2>REPORT_EXPORT</h2>
            <p>Generate and download filtered incident reports.</p>

            {/* 1. Date Range */}
            <div className="composer-field">
              <label className="composer-label">DATE RANGE</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <span style={{ fontSize: 10, color: 'var(--nt-dim)', display: 'block', marginBottom: 2 }}>FROM</span>
                  <input
                    type="date"
                    className="composer-input"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div>
                  <span style={{ fontSize: 10, color: 'var(--nt-dim)', display: 'block', marginBottom: 2 }}>TO</span>
                  <input
                    type="date"
                    className="composer-input"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 2. Zone */}
            <div className="composer-field">
              <label className="composer-label">ZONE</label>
              <select
                className="composer-input"
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
              >
                <option value="All Zones">All Zones</option>
                <option value="Zone A">Zone A</option>
                <option value="Zone B">Zone B</option>
                <option value="Zone C">Zone C</option>
                <option value="Zone D">Zone D</option>
                <option value="Zone E">Zone E</option>
                <option value="Zone F">Zone F</option>
              </select>
            </div>

            {/* 3. Severity */}
            <div className="composer-field">
              <label className="composer-label">SEVERITY</label>
              <select
                className="composer-input"
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {/* 4. Status */}
            <div className="composer-field">
              <label className="composer-label">STATUS</label>
              <select
                className="composer-input"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Resolved">Resolved</option>
                <option value="Dismissed">Dismissed</option>
              </select>
            </div>

            {/* 5. File Type */}
            <div className="composer-field">
              <label className="composer-label">FILE TYPE</label>
              <select
                className="composer-input"
                value={selectedFileType}
                onChange={(e) => setSelectedFileType(e.target.value)}
              >
                <option value="CSV (.csv)">CSV (.csv)</option>
                <option value="PDF (.pdf)">PDF (.pdf)</option>
                <option value="Excel (.xlsx)">Excel (.xlsx)</option>
              </select>
            </div>

            {/* 6. Download Button */}
            <button
              type="button"
              className="composer-submit"
              onClick={handleDownloadReport}
              disabled={downloading}
            >
              {downloading ? 'GENERATING REPORT...' : 'DOWNLOAD REPORT'}
            </button>
          </div>
        </div>

        {/* ── RIGHT PANEL: INCIDENT REPORTS LIST & TOOLBAR ── */}
        <div className="reports-right-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h1 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 24, letterSpacing: '0.08em', color: 'var(--nt-bright)' }}>
              ALL_INCIDENT_REPORTS ({reports.length})
            </h1>
          </div>

          {/* ── TOP FILTER TOOLBAR ── */}
          <div className="reports-toolbar">
            <div className="reports-toolbar-group">
              {/* 1. Date Filter */}
              <div className="reports-toolbar-field">
                <span className="reports-toolbar-label">DATE:</span>
                <input
                  type="date"
                  className="reports-toolbar-input"
                  value={tableDate}
                  onChange={(e) => setTableDate(e.target.value)}
                />
              </div>

              {/* 2. Severity Filter */}
              <div className="reports-toolbar-field">
                <span className="reports-toolbar-label">SEVERITY:</span>
                <select
                  className="reports-toolbar-select"
                  value={tableSeverity}
                  onChange={(e) => setTableSeverity(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              {/* 3. Zone Filter */}
              <div className="reports-toolbar-field">
                <span className="reports-toolbar-label">ZONE:</span>
                <select
                  className="reports-toolbar-select"
                  value={tableZone}
                  onChange={(e) => setTableZone(e.target.value)}
                >
                  <option value="All Zones">All Zones</option>
                  <option value="Zone A">Zone A</option>
                  <option value="Zone B">Zone B</option>
                  <option value="Zone C">Zone C</option>
                  <option value="Zone D">Zone D</option>
                  <option value="Zone E">Zone E</option>
                  <option value="Zone F">Zone F</option>
                </select>
              </div>

              {/* 4. Status Filter */}
              <div className="reports-toolbar-field">
                <span className="reports-toolbar-label">STATUS:</span>
                <select
                  className="reports-toolbar-select"
                  value={tableStatus}
                  onChange={(e) => setTableStatus(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="En Route">En Route</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Dismissed">Dismissed</option>
                </select>
              </div>
            </div>

            {/* 5. Search Section (Unified Control aligned right) */}
            <div className="unified-search-wrap">
              <input
                type="text"
                className="unified-search-input"
                placeholder="Search by ID"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="button"
                className="unified-search-btn"
                onClick={handleSearchSubmit}
                title="Search"
              >
                <Icon name="search" size={16} />
              </button>
            </div>
          </div>

          {/* ── INCIDENTS TABLE CONTAINER (INDEPENDENT SCROLL) ── */}
          <div className="reports-table-container">
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
                          #{r.incidentId || r._id}
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
                        <td>{r.zone || formatLocation(r.location)}</td>
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
        </div>
      </div>
    </div>
  );
}
