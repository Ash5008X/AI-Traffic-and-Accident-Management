import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PasswordField from '../../components/common/PasswordField';
import FormMessage from '../../components/common/FormMessage';
import Icon from '../../components/common/Icon';

export default function LoginPage() {
  const { login, getDashboardPath } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      const role = data?.user?.role || 'user';
      navigate(getDashboardPath(role));
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="brand-block">
        <Icon name="traffic" className="brand-icon" />
        <h1>NEXUSTRAFFIC</h1>
        <p>Traffic Intelligence & Incident Management</p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="field-wrap">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <PasswordField
          label="Password"
          id="login-password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />

        <div className="meta-row">
          <label className="remember-wrap">
            <input type="checkbox" />
            Remember me
          </label>
          <a href="#">Forgot?</a>
        </div>

        <button className="primary-btn" type="submit" disabled={loading}>
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      <FormMessage message={error} isError />

      <p className="switch-copy" style={{ marginTop: 16 }}>
        Don't have an account?
        <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
