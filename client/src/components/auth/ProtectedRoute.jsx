import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { isAuthenticated, role, loading, getDashboardPath, normalizeRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text-muted)' }}>
        Loading NexusTraffic...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0) {
    const normRole = normalizeRole(role);
    const normAllowed = allowedRoles.map(normalizeRole);
    if (!normAllowed.includes(normRole)) {
      return <Navigate to={getDashboardPath(normRole)} replace />;
    }
  }

  return <Outlet />;
}
