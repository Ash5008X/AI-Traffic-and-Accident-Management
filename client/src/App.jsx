import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import socketManager from './services/socket';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import UserLayout from './layouts/UserLayout';
import ReliefLayout from './layouts/ReliefLayout';
import FieldLayout from './layouts/FieldLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// User Pages
import UserDashboard from './pages/user/UserDashboard';
import UserReports from './pages/user/UserReports';
import UserAlerts from './pages/user/UserAlerts';
import UserProfile from './pages/user/UserProfile';

// Relief Admin Pages
import ReliefDashboard from './pages/relief/ReliefDashboard';
import ActiveIncidentsPage from './pages/relief/ActiveIncidentsPage';
import ReliefAlertsPage from './pages/relief/ReliefAlertsPage';
import ReliefReportsPage from './pages/relief/ReliefReportsPage';
import ReliefTeamsPage from './pages/relief/ReliefTeamsPage';

// Field Unit Pages
import FieldDashboard from './pages/field/FieldDashboard';
import FieldMissions from './pages/field/FieldMissions';
import FieldAlerts from './pages/field/FieldAlerts';
import FieldProfile from './pages/field/FieldProfile';

// Protected Route
import ProtectedRoute from './components/auth/ProtectedRoute';

// Mobile bottom nav for User and Relief/Field when logged in
import MobileNav from './components/layout/MobileNav';

function SocketConnector() {
  const { isAuthenticated, role, token } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token) {
      socketManager.connect(token);
    } else {
      socketManager.disconnect();
    }
    return () => {
      // Keep alive during app session
    };
  }, [isAuthenticated, token]);

  return null;
}

function MobileNavWrapper() {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated) return null;
  return <MobileNav role={role} />;
}

function DefaultRedirect() {
  const { isAuthenticated, role, getDashboardPath, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={getDashboardPath(role)} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <SocketConnector />
          <Routes>
            {/* Root redirect */}
            <Route path="/" element={<DefaultRedirect />} />

            {/* Auth routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* User routes */}
            <Route element={<ProtectedRoute allowedRoles={['user']} />}>
              <Route element={<UserLayout />}>
                <Route path="/user/dashboard" element={<UserDashboard />} />
                <Route path="/user/reports" element={<UserReports />} />
                <Route path="/user/alerts" element={<UserAlerts />} />
                <Route path="/user/profile" element={<UserProfile />} />
              </Route>
            </Route>

            {/* Relief Admin routes */}
            <Route element={<ProtectedRoute allowedRoles={['relief_admin']} />}>
              <Route element={<ReliefLayout />}>
                <Route path="/relief-center/dashboard" element={<ReliefDashboard />} />
                <Route path="/relief-center/active-incidents" element={<ActiveIncidentsPage />} />
                <Route path="/relief-center/alerts" element={<ReliefAlertsPage />} />
                <Route path="/relief-center/reports" element={<ReliefReportsPage />} />
                <Route path="/relief-center/teams" element={<ReliefTeamsPage />} />
              </Route>
            </Route>

            {/* Field Unit routes */}
            <Route element={<ProtectedRoute allowedRoles={['field_unit']} />}>
              <Route element={<FieldLayout />}>
                <Route path="/field/dashboard" element={<FieldDashboard />} />
                <Route path="/field/missions" element={<FieldMissions />} />
                <Route path="/field/alerts" element={<FieldAlerts />} />
                <Route path="/field/profile" element={<FieldProfile />} />
              </Route>
            </Route>

            {/* Catch all redirect */}
            <Route path="*" element={<DefaultRedirect />} />
          </Routes>
          <MobileNavWrapper />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
