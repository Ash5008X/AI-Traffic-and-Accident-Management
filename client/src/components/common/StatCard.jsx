export default function StatCard({ label, value, variant = '', className = '' }) {
  return (
    <div className={`card stat-card ${variant} ${className}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
