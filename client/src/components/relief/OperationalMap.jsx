import { useEffect, useRef, useState, useCallback } from 'react';
import api from '../../services/api';
import socketManager from '../../services/socket';
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

// Map severity levels to exact requested colors: Low=Green, Medium=Yellow, High=Orange, Critical=Red
function getSeverityColor(severity) {
  switch (severity?.toLowerCase()) {
    case 'low':
      return '#34C759'; // Green
    case 'medium':
      return '#FFCC00'; // Yellow
    case 'high':
      return '#FF9500'; // Orange
    case 'critical':
      return '#FF3B30'; // Red
    default:
      return '#FFCC00'; // Yellow fallback
  }
}

// Calculate lat/lng at a given distance (km) and bearing (deg) from center
function getDestinationLatLng(lat, lng, distKm, bearingDeg) {
  const R = 6371; // Earth radius in km
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

// Generate points for a 60-degree sector wedge (radius in km)
function generateSectorPolygonPoints(centerLat, centerLng, startDeg, endDeg, radiusKm = 3) {
  const points = [[centerLat, centerLng]];
  const step = 5; // Step in degrees for smooth arc

  for (let angle = startDeg; angle <= endDeg; angle += step) {
    points.push(getDestinationLatLng(centerLat, centerLng, radiusKm, angle));
  }
  if ((endDeg - startDeg) % step !== 0) {
    points.push(getDestinationLatLng(centerLat, centerLng, radiusKm, endDeg));
  }

  points.push([centerLat, centerLng]);
  return points;
}

export default function OperationalMap({ customIncidents, customCenter }) {
  const { user } = useAuth();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layerGroup = useRef(null);
  const [center, setCenter] = useState(() => {
    if (customCenter?.lat != null && customCenter?.lng != null) {
      return { lat: Number(customCenter.lat), lng: Number(customCenter.lng) };
    }
    if (user?.location?.lat != null && user?.location?.lng != null) {
      return { lat: Number(user.location.lat), lng: Number(user.location.lng) };
    }
    return null;
  });
  const [incidents, setIncidents] = useState([]);

  // Fetch Relief Center stored location from backend MongoDB
  const loadData = useCallback(async () => {
    if (customIncidents) {
      setIncidents(customIncidents);
    }
    try {
      const profile = await api.get('/auth/me').catch(() => user);
      if (profile && profile.location && profile.location.lat != null && profile.location.lng != null) {
        setCenter({
          lat: Number(profile.location.lat),
          lng: Number(profile.location.lng),
          name: profile.name || 'RELIEF CENTER',
        });
      }

      if (!customIncidents) {
        const incRes = await api.get('/incidents').catch(() => []);
        const active = (Array.isArray(incRes) ? incRes : []).filter((i) =>
          ['pending', 'en_route', 'dispatched'].includes(i.status)
        );
        setIncidents(active);
      }
    } catch (err) {
      console.error('[OperationalMap] Error loading map data:', err);
    }
  }, [user, customIncidents]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!center || !center.lat || !center.lng) {
      loadData();
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

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          maxZoom: 19,
          subdomains: 'abcd',
        }
      ).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      layerGroup.current = L.layerGroup().addTo(map);
      mapInstance.current = map;
    }

    loadData();

    if (!customIncidents) {
      socketManager.on('incident:new', loadData);
      socketManager.on('incident:updated', loadData);

      return () => {
        socketManager.off('incident:new', loadData);
        socketManager.off('incident:updated', loadData);
      };
    }
  }, [loadData, center, customIncidents]);

  // Render Map Layers using MongoDB Relief Center coordinates
  useEffect(() => {
    if (!center || !center.lat || !center.lng) return;
    const map = mapInstance.current;
    const group = layerGroup.current;
    const L = window.L;
    if (!map || !group || !L) return;

    group.clearLayers();
    map.setView([center.lat, center.lng], 13);

    // Draw 3 km Radius Boundary Circle around Relief Center
    L.circle([center.lat, center.lng], {
      radius: 3000,
      color: 'rgba(56, 189, 248, 0.4)',
      weight: 1.5,
      dashArray: '4, 4',
      fill: false,
    }).addTo(group);

    // Draw 6 Sector Wedges (Zone A - Zone F) relative to Relief Center
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
        fillOpacity: 0.18,
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

    // Relief Center Hub Marker
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
          <div style="font-family: 'Fira Code', monospace; font-size:11px; color:#CBD5E1; margin-top:4px;">
            LAT: ${center.lat.toFixed(4)}° | LNG: ${center.lng.toFixed(4)}°
          </div>
        </div>`,
        { className: 'map-popup-custom' }
      )
      .addTo(group);

    // Active Incident Markers
    incidents.forEach((inc) => {
      if (!inc.location || inc.location.lat == null || inc.location.lng == null) return;

      const sevColor = getSeverityColor(inc.severity);
      const incId = inc.incidentId || 'ZA-000000-000000';
      const zoneLabel = inc.zone || inc.assignedZone || 'Zone A';
      const coordsFormatted = formatLocation(inc.location);
      const reportedTimeFormatted = formatDate(inc.createdAt);

      const popupContent = `
        <div style="padding: 8px 10px; font-family: Outfit, sans-serif; min-width: 190px;">
          <div style="font-family: 'Fira Code', monospace; font-size: 10px; color: #94A3B8; font-weight: 600;">
            INCIDENT ID // ${incId}
          </div>
          <div style="font-weight: 700; font-size: 14px; color: #F8FAFC; margin: 4px 0;">
            ${inc.type || inc.title || 'Incident Report'}
          </div>
          <div style="display: flex; gap: 6px; font-size: 10px; margin: 6px 0; flex-wrap: wrap;">
            <span style="background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; color: ${sevColor}; font-weight: 800; border: 1px solid ${sevColor}; text-transform: uppercase;">
              SEVERITY: ${inc.severity?.toUpperCase() || 'MEDIUM'}
            </span>
            <span style="background: rgba(249,115,22,0.15); padding: 2px 6px; border-radius: 4px; color: #F97316; font-weight: 800; text-transform: uppercase;">
              ${inc.status === 'dispatched' ? 'EN ROUTE' : (inc.status || 'PENDING').toUpperCase()}
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
        </div>
      `;

      L.circleMarker([inc.location.lat, inc.location.lng], {
        radius: 7,
        fillColor: sevColor,
        fillOpacity: 0.95,
        color: '#FFFFFF',
        weight: 2,
        opacity: 0.9,
      })
        .bindPopup(popupContent, { className: 'map-popup-custom' })
        .addTo(group);
    });
  }, [center, incidents]);

  return (
    <div className="operational-map-container">
      <span className="operational-map-label">
        GEOSPATIAL COMMAND // 3.0 KM SECTOR MAP
      </span>
      <div ref={mapRef} />
    </div>
  );
}
