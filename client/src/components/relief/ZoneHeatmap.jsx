import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import socketManager from '../../services/socket';

const ALL_ZONES = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'Zone F'];

export default function ZoneHeatmap({ customData }) {
  const [heatmapData, setHeatmapData] = useState({
    'Zone A': 0,
    'Zone B': 0,
    'Zone C': 0,
    'Zone D': 0,
    'Zone E': 0,
    'Zone F': 0,
  });

  const fetchHeatmap = useCallback(async () => {
    if (customData) {
      const normalized = {};
      ALL_ZONES.forEach((z) => {
        const val = customData[z];
        normalized[z] = typeof val === 'object' ? val?.active || 0 : Number(val) || 0;
      });
      setHeatmapData(normalized);
      return;
    }
    try {
      const res = await api.get('/incidents/heatmap');
      if (res && typeof res === 'object') {
        setHeatmapData((prev) => ({
          ...prev,
          ...(Array.isArray(res)
            ? res.reduce((acc, curr) => ({ ...acc, [curr.zone]: curr.count }), {})
            : res),
        }));
      }
    } catch (err) {
      console.error('Heatmap load error:', err);
    }
  }, [customData]);

  useEffect(() => {
    fetchHeatmap();

    if (!customData) {
      socketManager.on('incident:new', fetchHeatmap);
      socketManager.on('incident:updated', fetchHeatmap);

      return () => {
        socketManager.off('incident:new', fetchHeatmap);
        socketManager.off('incident:updated', fetchHeatmap);
      };
    }
  }, [fetchHeatmap, customData]);

  const countsArray = ALL_ZONES.map((z) => heatmapData[z] || 0);
  const maxCount = Math.max(...countsArray);

  return (
    <div className="zone-grid">
      {ALL_ZONES.map((zone) => {
        const count = heatmapData[zone] || 0;
        const isHighest = count > 0 && count === maxCount;

        return (
          <div
            key={zone}
            className="zone-cell"
            style={{
              borderColor: isHighest ? 'rgba(255,59,48,0.6)' : 'rgba(31,52,72,0.5)',
              background: isHighest ? 'rgba(255,59,48,0.1)' : 'rgba(31,52,72,0.3)',
            }}
          >
            <span className="zone-name">{zone}</span>
            <span
              className="zone-count"
              style={{ color: isHighest ? '#FF3B30' : 'var(--nt-bright)' }}
            >
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}
