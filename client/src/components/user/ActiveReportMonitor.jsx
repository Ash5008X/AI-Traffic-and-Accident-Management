import Icon from '../common/Icon';
import { STATUS_STEPS, STATUS_STEP_LABELS, STATUS_STEP_ICONS } from '../../utils/constants';

export default function ActiveReportMonitor({ report }) {
  if (!report) {
    return (
      <div className="card status-card" style={{ textAlign: 'center', padding: 32 }}>
        <Icon name="check_circle" size={36} style={{ color: 'var(--success)', marginBottom: 8 }} />
        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>No Active Reports</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>All incidents are resolved.</div>
      </div>
    );
  }

  const currentStepIdx = STATUS_STEPS.indexOf(report.status);

  return (
    <div className="card status-card">
      <div className="section-head">
        <span className="section-label">
          <Icon name="track_changes" size={16} />
          Active Report Monitor
        </span>
        <span className="section-meta">
          <span className="section-badge">{report.status?.toUpperCase()}</span>
        </span>
      </div>

      <div className="status-headline">
        {report.type || report.title} — {report.location?.address || 'Unknown'}
      </div>
      <div className="status-sub">
        Tracking incident response in real-time
      </div>

      <div className="timeline">
        <div className="tl-track" />
        <div
          className="tl-fill"
          style={{ width: `${(currentStepIdx / (STATUS_STEPS.length - 1)) * 100}%` }}
        />
        <div className="tl-steps">
          {STATUS_STEPS.map((step, i) => {
            let state = 'pending';
            if (i < currentStepIdx) state = 'done';
            else if (i === currentStepIdx) state = 'active';

            return (
              <div className="tl-step" key={step}>
                <div className={`tl-dot ${state}`}>
                  <Icon name={STATUS_STEP_ICONS[i]} />
                </div>
                <span className={`tl-label ${state}`}>
                  {STATUS_STEP_LABELS[i]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
