import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Icon from '../common/Icon';
import api from '../../services/api';
import { INCIDENT_TYPES, SEVERITY_LEVELS } from '../../utils/constants';

export default function ReportModal({ isOpen, onClose, onSubmit }) {
  const [form, setForm] = useState({
    type: 'Congestion',
    severity: 'medium',
    description: '',
  });
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Try to get geolocation when modal opens
  useEffect(() => {
    if (isOpen && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        () => {
          // Fallback
          setLocation({ lat: 31.2649, lng: 75.7002 });
        }
      );
    }
  }, [isOpen]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/incidents', {
        type: form.type,
        severity: form.severity,
        description: form.description,
        title: `${form.type} Report`,
        location: location || { lat: 31.2649, lng: 75.7002 },
      });
      onSubmit();
    } catch (err) {
      setError(err.message || 'Failed to submit report.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Incident">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Incident Type</label>
          <select className="form-control" value={form.type} onChange={update('type')}>
            {INCIDENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Severity</label>
          <select className="form-control" value={form.severity} onChange={update('severity')}>
            {SEVERITY_LEVELS.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            className="form-control"
            placeholder="Describe the incident..."
            value={form.description}
            onChange={update('description')}
            rows={3}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 8 }}>
          <label>Location</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
            <Icon name="my_location" size={16} style={{ color: 'var(--accent)' }} />
            {location
              ? `${location.lat.toFixed(4)}° N, ${location.lng.toFixed(4)}° E`
              : 'Acquiring GPS...'}
          </div>
        </div>

        {error && (
          <div className="form-group">
            <div style={{ color: 'var(--critical)', fontSize: 13 }}>{error}</div>
          </div>
        )}

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
