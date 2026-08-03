export default function ZoneHeatmap({ incidents }) {
  // Aggregate incidents by zone
  const counts = {};
  const zones = ['SECTOR-N', 'SECTOR-S', 'SECTOR-E', 'SECTOR-W'];
  zones.forEach((z) => (counts[z] = 0));

  incidents.forEach((inc) => {
    const zone = inc.zone || 'SECTOR-N';
    counts[zone] = (counts[zone] || 0) + 1;
  });

  return (
    <div className="zone-grid">
      {Object.entries(counts).map(([zone, count]) => {
        const isHigh = count >= 3;
        return (
          <div
            key={zone}
            className="zone-cell"
            style={{
              borderColor: isHigh ? 'rgba(255,59,48,0.6)' : 'rgba(31,52,72,0.5)',
              background: isHigh ? 'rgba(255,59,48,0.1)' : 'rgba(31,52,72,0.3)',
            }}
          >
            <span className="zone-name">{zone}</span>
            <span className="zone-count" style={{ color: isHigh ? '#FF3B30' : 'var(--nt-bright)' }}>
              {String(count).padStart(2, '0')}
            </span>
          </div>
        );
      })}
    </div>
  );
}
