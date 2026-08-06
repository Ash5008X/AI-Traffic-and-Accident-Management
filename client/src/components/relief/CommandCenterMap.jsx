import { useEffect, useRef, useState, useCallback } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatLocation } from '../../utils/formatters';

const ZONE_COLORS = {
  'Zone A': { fill: '#3B82F6', stroke: '#60A5FA' }, // Blue
  'Zone B': { fill: '#8B5CF6', stroke: '#A78BFA' }, // Purple
  'Zone C': { fill: '#06B6D4', stroke: '#22D3EE' }, // Cyan
  'Zone D': { fill: '#EC4899', stroke: '#F472B6' }, // Pink
  'Zone E': { fill: '#14B8A6', stroke: '#2DD4BF' }, // Teal
  'Zone F': { fill: '#6366F1', stroke: '#818CF8' }, // Indigo
};

// Active incident severity colors
function getActiveSeverityColor(severity) {
  switch (severity?.toLowerCase()) {
    case 'low': return '#34C759'; // Green
    case 'medium': return '#FFCC00'; // Yellow
    case 'high': return '#FF9500'; // Orange
    case 'critical': return '#FF3B30'; // Red
    default: return '#FFCC00';
  }
}

// Resolved / Dismissed incident severity colors (subdued greys)
function getResolvedSeverityColor(severity) {
  switch (severity?.toLowerCase()) {
    case 'low': return '#CBD5E1'; // Light Grey
    case 'medium': return '#94A3B8'; // Medium Grey
    case 'high': return '#64748B'; // Dark Grey
    case 'critical': return '#334155'; // Darkest Grey
    default: return '#94A3B8';
  }
}

function getDestinationLatLng(lat, lng, distKm, bearingDeg) {
  const R = 6371;
  const d = distKm / R;
  const brng = (bearingDeg * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lon1 = (lng * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) +
      Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
    );

  return [(lat2 * 180) / Math.PI, (lon2 * 180) / Math.PI];
}

function generateSectorPolygonPoints(centerLat, centerLng, startDeg, endDeg, radiusKm = 3) {
  const points = [[centerLat, centerLng]];
  const step = 5;

  for (let angle = startDeg; angle <= endDeg; angle += step) {
    points.push(getDestinationLatLng(centerLat, centerLng, radiusKm, angle));
  }
  if ((endDeg - startDeg) % step !== 0) {
    points.push(getDestinationLatLng(centerLat, centerLng, radiusKm, endDeg));
  }

  points.push([centerLat, centerLng]);
  return points;
}

export default function CommandCenterMap({ incidents = [], selectedIncident = null, onSelectIncident, customCenter }) {
  const { user } = useAuth();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layerGroup = useRef(null);
  const markersMap = useRef(new Map());
  const [center, setCenter] = useState(() => {
    if (customCenter?.lat != null && customCenter?.lng != null) {
      return { lat: Number(customCenter.lat), lng: Number(customCenter.lng) };
    }
    if (user?.location?.lat != null && user?.location?.lng != null) {
      return { lat: Number(user.location.lat), lng: Number(user.location.lng) };
    }
    return null;
  });

  // Fetch Relief Center location stored in MongoDB
  const loadCenter = useCallback(async () => {
    try {
      const profile = await api.get('/auth/me').catch(() => user);
      if (profile && profile.location && profile.location.lat != null && profile.location.lng != null) {
        setCenter({
          lat: Number(profile.location.lat),
          lng: Number(profile.location.lng),
          name: profile.name || 'RELIEF CENTER COMMAND',
        });
      }
    } catch (err) {
      console.error('[CommandCenterMap] Error loading center profile:', err);
    }
  }, [user]);

  // Init Map
  useEffect(() => {
    if (!center || !center.lat || !center.lng) {
      loadCenter();
      return;
    }
    if (!mapRef.current) return;
    const L = window.L;
    if (!L) return;

    if (!mapInstance.current) {
      const map = L.map(mapRef.current, {
        center: [center.lat, center.lng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      layerGroup.current = L.layerGroup().addTo(map);
      mapInstance.current = map;
    }

    loadCenter();
  }, [loadCenter, center]);

  // Draw Layers & Markers using Relief Center MongoDB coordinates
  useEffect(() => {
    if (!center || !center.lat || !center.lng) return;
    const map = mapInstance.current;
    const group = layerGroup.current;
    const L = window.L;
    if (!map || !group || !L) return;

    group.clearLayers();
    markersMap.current.clear();

    // 3 km Boundary Circle
    L.circle([center.lat, center.lng], {
      radius: 3000,
      color: 'rgba(56, 189, 248, 0.4)',
      weight: 1.5,
      dashArray: '4, 4',
      fill: false,
    }).addTo(group);

    // 6 Sector Wedges
    const zones = [
      { name: 'Zone A', start: 0, end: 60 },
      { name: 'Zone B', start: 60, end: 120 },
      { name: 'Zone C', start: 120, end: 180 },
      { name: 'Zone D', start: 180, end: 240 },
      { name: 'Zone E', start: 240, end: 300 },
      { name: 'Zone F', start: 300, end: 360 },
    ];

    zones.forEach(({ name, start, end }) => {
      const colorScheme = ZONE_COLORS[name] || ZONE_COLORS['Zone A'];
      const pts = generateSectorPolygonPoints(center.lat, center.lng, start, end, 3);

      L.polygon(pts, {
        fillColor: colorScheme.fill,
        fillOpacity: 0.16,
        color: colorScheme.stroke,
        weight: 1.5,
      }).addTo(group);

      const midAngle = (start + end) / 2;
      const labelPos = getDestinationLatLng(center.lat, center.lng, 1.8, midAngle);
      const labelIcon = L.divIcon({
        className: 'zone-sector-label-container',
        html: `<div class="zone-sector-label" style="border-color:${colorScheme.stroke}">${name}</div>`,
        iconSize: [50, 20],
        iconAnchor: [25, 10],
      });
      L.marker(labelPos, { icon: labelIcon, interactive: false }).addTo(group);
    });

    // Hub Marker
    const hubIcon = L.divIcon({
      className: 'hub-marker-icon-wrap',
      html: `<div class="hub-marker-icon"><div class="hub-marker-inner"></div></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    L.marker([center.lat, center.lng], { icon: hubIcon })
      .bindPopup(
        `<div style="padding: 6px; font-family: Outfit, sans-serif;">
          <strong style="color:#F97316; font-size:14px;">COMMAND HUB // ${center.name || 'RELIEF CENTER'}</strong>
          <div style="font-size:11px; color:#94A3B8; margin-top:4px;">3.0 KM Sector Operational Coverage</div>
        </div>`,
        { className: 'map-popup-custom' }
      )
      .addTo(group);

    // Render ALL Incidents from last 24h
    incidents.forEach((inc) => {
      if (!inc.location || inc.location.lat == null || inc.location.lng == null) return;

      const isResolved = ['resolved', 'dismissed'].includes(inc.status);
      const color = isResolved
        ? getResolvedSeverityColor(inc.severity)
        : getActiveSeverityColor(inc.severity);

      const incId = inc.incidentId || 'ZA-000000-000000';
      const zoneLabel = inc.zone || 'Zone A';
      const coordsFormatted = formatLocation(inc.location);
      const reportedTimeFormatted = formatDate(inc.createdAt);
      const resolvedTimeFormatted = inc.resolvedAt
        ? formatDate(inc.resolvedAt)
        : inc.dismissedAt
        ? formatDate(inc.dismissedAt)
        : null;

      const popupContent = `
        <div style="padding: 8px 10px; font-family: Outfit, sans-serif; min-width: 200px;">
          <div style="font-family: 'Fira Code', monospace; font-size: 10px; color: #94A3B8; font-weight: 600;">
            INCIDENT ID // ${incId}
          </div>
          <div style="font-weight: 700; font-size: 14px; color: #F8FAFC; margin: 4px 0;">
            ${inc.type || inc.title || 'Incident Report'}
          </div>
          <div style="display: flex; gap: 6px; font-size: 10px; margin: 6px 0; flex-wrap: wrap;">
            <span style="background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; color: ${color}; font-weight: 800; border: 1px solid ${color}; text-transform: uppercase;">
              ${inc.severity?.toUpperCase() || 'MEDIUM'}
            </span>
            <span style="background: ${isResolved ? 'rgba(148,163,184,0.15)' : 'rgba(249,115,22,0.15)'}; padding: 2px 6px; border-radius: 4px; color: ${isResolved ? '#94A3B8' : '#F97316'}; font-weight: 800; text-transform: uppercase;">
              ${inc.status === 'dismissed' ? 'DISMISSED' : inc.status === 'dispatched' ? 'EN ROUTE' : (inc.status || 'PENDING').toUpperCase()}
            </span>
          </div>
          <div style="font-size: 11px; color: #CBD5E1; margin-bottom: 3px;">
            <strong style="color: #94A3B8;">Zone:</strong> ${zoneLabel}
          </div>
          <div style="font-size: 11px; color: #CBD5E1; margin-bottom: 3px;">
            <strong style="color: #94A3B8;">Coordinates:</strong> ${coordsFormatted}
          </div>
          <div style="font-family: 'Fira Code', monospace; font-size: 10px; color: #64748B; margin-top: 6px;">
            REPORTED: ${reportedTimeFormatted}
          </div>
          ${
            resolvedTimeFormatted
              ? `<div style="font-family: 'Fira Code', monospace; font-size: 10px; color: #34C759; margin-top: 2px;">
                  RESOLVED: ${resolvedTimeFormatted}
                </div>`
              : ''
          }
        </div>
      `;

      const marker = L.circleMarker([inc.location.lat, inc.location.lng], {
        radius: isResolved ? 6 : 8,
        fillColor: color,
        fillOpacity: isResolved ? 0.6 : 0.95,
        color: isResolved ? '#64748B' : '#FFFFFF',
        weight: isResolved ? 1 : 2,
        opacity: 0.9,
      })
        .bindPopup(popupContent, { className: 'map-popup-custom' })
        .addTo(group);

      if (onSelectIncident) {
        marker.on('click', () => onSelectIncident(inc));
      }

      markersMap.current.set(inc._id, marker);
    });
  }, [center, incidents, onSelectIncident]);

  // Zoom & Highlight when selectedIncident changes
  useEffect(() => {
    if (!selectedIncident || !mapInstance.current) return;
    const map = mapInstance.current;
    const marker = markersMap.current.get(selectedIncident._id);

    if (selectedIncident.location && selectedIncident.location.lat != null) {
      map.flyTo([selectedIncident.location.lat, selectedIncident.location.lng], 15, {
        duration: 1.2,
      });
      if (marker) {
        marker.openPopup();
      }
    }
  }, [selectedIncident]);

  return (
    <div className="command-map-wrapper" style={{ width: '100%', height: '100%', minHeight: '520px', position: 'relative' }}>
      <span className="operational-map-label">
        COMMAND MAP // 24-HOUR INCIDENT DISTRIBUTION
      </span>
      <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: '520px' }} />
    </div>
  );
}
