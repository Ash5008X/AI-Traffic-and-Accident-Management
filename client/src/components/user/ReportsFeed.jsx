import Icon from '../common/Icon';
import { timeAgo, formatLocation } from '../../utils/formatters';
import { getSeverityClass } from '../../utils/severity';

export default function ReportsFeed({ reports, loading }) {
  const recent = [...reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <div className="card feed-card">
      <div className="feed-header">
        <span className="feed-header-title">Recent Reports</span>
        <span className="section-meta">
          {reports.length} Total
        </span>
      </div>
      <div className="feed-body">
        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading reports...
          </div>
        ) : recent.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No reports filed yet. Click "Report Incident" to get started.
          </div>
        ) : (
          recent.map((report) => {
            const sevClass = getSeverityClass(report.severity);
            return (
              <div className="feed-row" key={report._id}>
                <div className={`sev-bar ${sevClass}`} />
                <div className="feed-row-main">
                  <div className="feed-row-title">
                    {report.type || report.title} — {formatLocation(report.location)}
                  </div>
                  <div className="feed-row-body">{report.description || 'No description.'}</div>
                  <div className="feed-row-tags">
                    <span className={`sev-pill ${sevClass}`}>{report.severity || 'medium'}</span>
                    <span className="mono-meta">{timeAgo(report.createdAt)}</span>
                    <span className="mono-meta">{report.status}</span>
                  </div>
                </div>
                <Icon name="chevron_right" className="row-arrow" />
              </div>
            );
          })
        )}
      </div>

      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="mon-row">
          <div className="mon-dot" />
          <span className="mon-label">Real-Time Monitoring Active</span>
        </div>
      </div>
    </div>
  );
}
