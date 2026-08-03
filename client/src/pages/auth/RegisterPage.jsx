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

export default function RegisterPage() {
  const { register, getDashboardPath } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const data = await register(form);
      navigate(getDashboardPath(data?.user?.role || form.role));
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

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

        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
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
