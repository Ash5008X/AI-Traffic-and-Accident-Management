import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import socketManager from '../../services/socket';
import Icon from '../../components/common/Icon';
import { formatDate, timeAgo, formatLocation } from '../../utils/formatters';
import { getSeverityClass, getStatusClass } from '../../utils/severity';
import { STATUS_STEPS, STATUS_STEP_LABELS, STATUS_STEP_ICONS } from '../../utils/constants';
import '../../styles/user.css';

export default function UserReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  const loadReports = useCallback(async () => {
    try {
      const data = await api.get('/incidents?reportedBy=me');
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();

    socketManager.on('incident:updated', loadReports);
    socketManager.on('incident:new', loadReports);

    return () => {
      socketManager.off('incident:updated', loadReports);
      socketManager.off('incident:new', loadReports);
    };
  }, [loadReports]);

  const activeReports = reports.filter((r) => ['pending', 'en_route', 'dispatched'].includes(r.status));
  const pastReports = reports.filter((r) => ['resolved', 'dismissed'].includes(r.status));
  const total = reports.length;
  const resolved = pastReports.filter((r) => r.status === 'resolved').length;

  const filteredPast = filter === 'all' ? pastReports : pastReports.filter((r) => r.status === filter);

  const selectReport = (report) => setSelected(report);
  const currentStepIdx = selected ? STATUS_STEPS.indexOf(selected.status) : 0;

  return (
    <div className="page-layout">
      <div className="left-col">
        {/* Stats */}
        <div className="stat-grid">
          <div className="card stat-card accent">
            <div className="stat-label">Total Reports</div>
            <div className="stat-value">{total}</div>
          </div>
          <div className="card stat-card critical">
            <div className="stat-label">Active</div>
            <div className="stat-value">{activeReports.length}</div>
          </div>
          <div className="card stat-card success">
            <div className="stat-label">Resolved</div>
            <div className="stat-value">{resolved}</div>
          </div>
        </div>

        {/* Active Reports */}
        <div>
          <div className="section-head">
            <span className="section-label">
              <Icon name="pending_actions" size={16} />
              Active Reports
            </span>
            <span className="section-meta">
              <span className="section-badge">{activeReports.length}</span>
            </span>
          </div>
          {activeReports.length === 0 ? (
            <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
              No active reports.
            </div>
          ) : (
            activeReports.map((report) => {
              const sevClass = getSeverityClass(report.severity);
              const stepIdx = STATUS_STEPS.indexOf(report.status);
              return (
                <div
                  className={`card report-card ${sevClass}`}
                  key={report._id}
                  onClick={() => selectReport(report)}
                >
                  <div className="report-card-top">
                    <span className="ticket-id">TICKET #{report.incidentId || report._id}</span>
                    <span className={`status-badge ${getStatusClass(report.status)}`}>{report.status}</span>
                  </div>
                  <div className="report-title">{report.type || report.title} — {formatLocation(report.location)}</div>
                  <div className="report-meta">
                    <span className="meta-item">{report.severity?.toUpperCase()}</span>
                    <span className="meta-item muted">{timeAgo(report.createdAt)}</span>
                  </div>
                  <div className="report-body">{report.description || 'No description.'}</div>
                  <div className="progress-row">
                    {STATUS_STEPS.map((step, i) => {
                      let state = 'pending';
                      if (i < stepIdx) state = 'done';
                      else if (i === stepIdx) state = 'active';
                      return (
                        <div key={step} style={{ display: 'contents' }}>
                          <div className="prog-step">
                            <div className={`prog-dot ${state}`}>
                              <Icon name={STATUS_STEP_ICONS[i]} />
                            </div>
                            <span className={`prog-label ${state}`}>{STATUS_STEP_LABELS[i]}</span>
                          </div>
                          {i < STATUS_STEPS.length - 1 && (
                            <div className={`prog-line ${i < stepIdx ? 'done' : 'pending'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Past Reports */}
        <div>
          <div className="section-head">
            <span className="section-label">
              <Icon name="history" size={16} />
              Past Reports
            </span>
            <div className="filter-row">
              {['all', 'resolved', 'dismissed'].map((f) => (
                <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="card past-table">
            {filteredPast.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
                No past reports.
              </div>
            ) : (
              filteredPast.map((report) => (
                <div className="past-row" key={report._id} onClick={() => selectReport(report)}>
                  <div className="past-row-main">
                    <span className="past-row-id">#{report.incidentId || report._id}</span>
                    <span className="past-row-title">{report.type || report.title}</span>
                  </div>
                  <span className="past-row-date">{timeAgo(report.createdAt)}</span>
                  <span className={`past-pill ${report.status}`}>
                    {report.status === 'dismissed' ? 'Dismissed (False Alarm)' : report.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Detail Panel */}
      <div className="right-col">
        {!selected ? (
          <div className="card detail-panel" style={{ textAlign: 'center', padding: 40 }}>
            <Icon name="description" size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Select a Report</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Click any report to view details.</div>
          </div>
        ) : (
          <div className="card detail-panel">
            <div className="detail-header">
              <span className="detail-header-title">Report Detail</span>
              <button className="icon-btn" onClick={() => setSelected(null)}>
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="detail-body">
              <div className="detail-ticket-row">
                <span className="detail-ticket-id">TICKET #{selected.incidentId || selected._id}</span>
              </div>
              <div className="detail-title">{selected.type || selected.title} — {formatLocation(selected.location)}</div>
              <div className="detail-coords">
                <Icon name="location_on" size={14} />
                {selected.location?.lat?.toFixed(4)}° N, {selected.location?.lng?.toFixed(4)}° E
              </div>
              <div className="detail-desc">{selected.description || 'No description.'}</div>
              <div className="detail-meta-grid">
                <div className="detail-meta-row">
                  <span className="detail-meta-key">Status</span>
                  <span className="detail-meta-val">{selected.status?.toUpperCase()}</span>
                </div>
                <div className="detail-meta-row">
                  <span className="detail-meta-key">Severity</span>
                  <span className="detail-meta-val">{selected.severity?.toUpperCase()}</span>
                </div>
                <div className="detail-meta-row">
                  <span className="detail-meta-key">Reported</span>
                  <span className="detail-meta-val">{formatDate(selected.createdAt)}</span>
                </div>
              </div>

              {/* Timeline */}
              <div className="timeline" style={{ marginTop: 16 }}>
                <div className="tl-track" />
                <div className="tl-fill" style={{ width: `${(currentStepIdx / (STATUS_STEPS.length - 1)) * 100}%` }} />
                <div className="tl-steps">
                  {STATUS_STEPS.map((step, i) => {
                    let state = 'pending';
                    if (i < currentStepIdx) state = 'done';
                    else if (i === currentStepIdx) state = 'active';
                    return (
                      <div className="tl-step" key={step}>
                        <div className={`tl-dot ${state}`}><Icon name={STATUS_STEP_ICONS[i]} /></div>
                        <span className={`tl-label ${state}`}>{STATUS_STEP_LABELS[i]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
