export default function SystemFooter() {
  return (
    <footer className="system-footer">
      <div className="fira-code" style={{ fontSize: '10px', color: 'var(--nt-dim)' }}>
        SYSTEM_STATUS: NOMINAL // ENCRYPTION: AES-256-ACTIVE
      </div>
      <div style={{ display: 'flex', gap: '16px' }}>
        <span className="fira-code" style={{ fontSize: '10px', color: 'var(--nt-dim)' }}>LAT: 31.2649</span>
        <span className="fira-code" style={{ fontSize: '10px', color: 'var(--nt-dim)' }}>LONG: 75.7002</span>
      </div>
    </footer>
  );
}
