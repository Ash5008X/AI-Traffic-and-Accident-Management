import Icon from '../common/Icon';

export default function HeroCard({ onReport }) {
  return (
    <div className="card hero-card">
      <div className="hero-eyebrow">
        <span className="badge badge-live">
          <span className="live-pulse" />
          LIVE
        </span>
        <span className="badge badge-ref">MONITOR_ACTIVE</span>
      </div>

      <h1 className="hero-title">Traffic Intelligence Dashboard</h1>
      <p className="hero-sub">
        Real-time incident monitoring and reporting system. Submit reports, track response status, and receive proximity-based safety alerts.
      </p>

      <div className="btn-row">
        <button className="btn btn-primary" onClick={onReport}>
          <Icon name="add_circle" size={18} />
          Report Incident
        </button>
        <button className="btn btn-ghost">
          <Icon name="map" size={18} />
          View Map
        </button>
      </div>
    </div>
  );
}
