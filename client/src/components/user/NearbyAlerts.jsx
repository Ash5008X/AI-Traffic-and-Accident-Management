import Icon from '../common/Icon';
import { timeAgo, formatLocation } from '../../utils/formatters';
import { getSeverityClass } from '../../utils/severity';

export default function NearbyAlerts({ incidents, userId }) {
  // Filter: not reported by current user, with location data, active statuses only
  const nearby = incidents
    .filter(
      (inc) =>
        inc.reportedBy !== userId &&
        inc.location &&
        ['pending', 'en_route', 'dispatched'].includes(inc.status)
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div>
      <div className="section-head">
        <span className="section-label">
          <Icon name="warning" size={16} />
          Nearby Alerts
        </span>
        <span className="section-meta">
          <span className="section-badge">{nearby.length}</span>
        </span>
      </div>

      <div className="alerts-list">
        {nearby.length === 0 ? (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            No nearby alerts at this time.
          </div>
        ) : (
          nearby.map((inc) => {
            const sevClass = getSeverityClass(inc.severity);
            return (
              <div className="alert-row" key={inc._id}>
                <div className={`ar-bar`} style={{ background: `var(--${sevClass === 'critical' ? 'critical' : sevClass === 'warning' ? 'warning' : 'info'})` }} />
                <div className="ar-content">
                  <div className="ar-title">
                    {inc.type} — {formatLocation(inc.location)}
                  </div>
                  <div className="ar-meta">
                    <span className="ar-ref">{inc.incidentId || inc._id}</span>
                    <span className="ar-sep" />
                    <span className="ar-dist">{timeAgo(inc.createdAt)}</span>
                  </div>
                </div>
                <Icon name="chevron_right" className="ar-arrow" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
