import Icon from '../common/Icon';
import { timeAgo } from '../../utils/formatters';
import { getSeverityClass } from '../../utils/severity';

export default function IncidentQueue({ incidents, selectedId, onSelect, filter, onFilterChange }) {
  const filtered = incidents.filter((inc) => {
    if (filter === 'all') return true;
    if (filter === 'critical') return inc.severity === 'critical';
    if (filter === 'active') return ['pending', 'en_route', 'dispatched'].includes(inc.status);
    return true;
  });

  const newCount = incidents.filter((inc) => inc.status === 'pending').length;

  return (
    <div className="relief-col-left">
      <div className="queue-header">
        <span className="queue-title">INCIDENT QUEUE // 1-HR LOGS ({filtered.length})</span>
        {newCount > 0 && <span className="new-badge">{newCount} NEW</span>}
      </div>

      <div style={{ padding: '8px 16px', display: 'flex', gap: '8px', borderBottom: '1px solid rgba(31,52,72,0.3)' }}>
        {[
          { key: 'all', label: 'All' },
          { key: 'active', label: 'Active' },
          { key: 'critical', label: 'Critical' },
        ].map((btn) => (
          <button
            key={btn.key}
            onClick={() => onFilterChange(btn.key)}
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              border: '1px solid var(--nt-card-border)',
              background: filter === btn.key ? '#F97316' : 'var(--nt-card)',
              color: filter === btn.key ? '#FFF' : 'var(--nt-dim)',
              fontSize: '11px',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700,
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <div>
        {filtered.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--nt-dim)', fontSize: '13px' }}>
            No incidents matching filter.
          </div>
        ) : (
          filtered.map((inc) => {
            const isSelected = selectedId === inc._id;
            const sevClass = getSeverityClass(inc.severity);
            const displayId = inc.incidentId || inc._id || 'UNKNOWN';

            return (
              <div
                key={inc._id}
                className={`inc-card ${isSelected ? 'selected' : ''}`}
                style={{
                  borderLeftColor:
                    sevClass === 'critical'
                      ? '#FF3B30'
                      : sevClass === 'warning'
                      ? '#FF9500'
                      : '#3A86FF',
                }}
                onClick={() => onSelect(inc)}
              >
                <div className="inc-card-top">
                  <span className="inc-card-id">{displayId} // {inc.zone || 'GEN'}</span>
                  <span className="inc-card-time">{timeAgo(inc.createdAt)}</span>
                </div>
                <div className="inc-card-title">{inc.type || inc.title || 'Incident'}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    className="inc-sev-badge"
                    style={{
                      background:
                        sevClass === 'critical'
                          ? 'rgba(255,59,48,0.15)'
                          : sevClass === 'warning'
                          ? 'rgba(255,149,0,0.15)'
                          : 'rgba(58,134,255,0.15)',
                      color:
                        sevClass === 'critical'
                          ? '#FF3B30'
                          : sevClass === 'warning'
                          ? '#FF9500'
                          : '#3A86FF',
                    }}
                  >
                    {inc.severity || 'normal'}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--nt-dim)', textTransform: 'uppercase' }}>
                    {inc.status || 'pending'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
