import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PasswordField from '../../components/common/PasswordField';
import FormMessage from '../../components/common/FormMessage';
import Icon from '../../components/common/Icon';

const ROLES = [
  { value: 'user', label: 'User', icon: 'person' },
  { value: 'relief_admin', label: 'Relief Admin', icon: 'local_hospital' },
  { value: 'field_unit', label: 'Field Unit', icon: 'directions_car' },
];

/**
 * Wraps the browser Geolocation API in a Promise for async/await usage.
 * Resolves with { latitude, longitude } or rejects with a user-friendly error.
 */
function requestBrowserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Your browser does not support geolocation. Please use a modern browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            reject(new Error('Location permission is required to register a Relief Center.'));
            break;
          case err.POSITION_UNAVAILABLE:
            reject(new Error('Unable to determine your location. Please check your device settings.'));
            break;
          case err.TIMEOUT:
            reject(new Error('Location request timed out. Please try again.'));
            break;
          default:
            reject(new Error('An unexpected error occurred while detecting your location.'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
}

export default function RegisterPage() {
  const { register, getDashboardPath } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    let payload = { ...form };

    // For relief_admin, acquire GPS coordinates before registration
    if (form.role === 'relief_admin') {
      setLocating(true);
      try {
        const coords = await requestBrowserLocation();
        payload.latitude = coords.latitude;
        payload.longitude = coords.longitude;
      } catch (locErr) {
        setError(locErr.message);
        setLocating(false);
        return;
      }
      setLocating(false);
    }

    setLoading(true);
    try {
      const data = await register(payload);
      navigate(getDashboardPath(data?.user?.role || form.role));
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const isSubmitting = loading || locating;

  return (
    <div className="auth-card">
      <div className="brand-block">
        <Icon name="traffic" className="brand-icon" />
        <h1>CREATE ACCOUNT</h1>
        <p>Join the NexusTraffic network</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="field-wrap">
          <label htmlFor="reg-name">Full Name</label>
          <input
            id="reg-name"
            type="text"
            placeholder="Your name"
            required
            value={form.name}
            onChange={update('name')}
          />
        </div>

        <div className="field-wrap">
          <label htmlFor="reg-email">Email</label>
          <input
            id="reg-email"
            type="email"
            placeholder="you@example.com"
            required
            value={form.email}
            onChange={update('email')}
          />
        </div>

        <PasswordField
          label="Password"
          id="reg-password"
          name="password"
          value={form.password}
          onChange={update('password')}
          placeholder="Min 6 characters"
          required
        />

        <fieldset className="role-group">
          <legend>Select Role</legend>
          <div className="role-options">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className={`role-option ${form.role === r.value ? 'active' : ''}`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={form.role === r.value}
                  onChange={update('role')}
                />
                <Icon name={r.icon} />
                {r.label}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Location notice for Relief Admin */}
        {form.role === 'relief_admin' && (
          <div className={`location-status ${locating ? 'detecting' : ''}`}>
            <Icon name={locating ? 'my_location' : 'info'} />
            <span>
              {locating
                ? 'Detecting your location...'
                : 'Your current GPS location will be used as the Relief Center location.'}
            </span>
          </div>
        )}

        <button className="primary-btn" type="submit" disabled={isSubmitting}>
          {locating
            ? 'Detecting Location...'
            : loading
              ? 'Creating Account...'
              : 'Create Account'}
        </button>
      </form>

      <FormMessage message={error} isError />

      <p className="switch-copy" style={{ marginTop: 16 }}>
        Already have an account?
        <Link to="/login">Sign In</Link>
      </p>
    </div>
  );
}
