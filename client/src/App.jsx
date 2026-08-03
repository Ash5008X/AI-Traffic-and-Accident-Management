import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import socketManager from './services/socket';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import UserLayout from './layouts/UserLayout';
import ReliefLayout from './layouts/ReliefLayout';
import FieldLayout from './layouts/FieldLayout';

// Protected Route & Navigation
import ProtectedRoute from './components/auth/ProtectedRoute';
import MobileNav from './components/layout/MobileNav';

// Lazy-loaded Auth Pages
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));

// Lazy-loaded User Pages
const UserDashboard = lazy(() => import('./pages/user/UserDashboard'));
const UserReports = lazy(() => import('./pages/user/UserReports'));
const UserAlerts = lazy(() => import('./pages/user/UserAlerts'));
const UserProfile = lazy(() => import('./pages/user/UserProfile'));

// Lazy-loaded Relief Admin Pages
const ReliefDashboard = lazy(() => import('./pages/relief/ReliefDashboard'));
const ActiveIncidentsPage = lazy(() => import('./pages/relief/ActiveIncidentsPage'));
const ReliefAlertsPage = lazy(() => import('./pages/relief/ReliefAlertsPage'));
const ReliefReportsPage = lazy(() => import('./pages/relief/ReliefReportsPage'));
const ReliefTeamsPage = lazy(() => import('./pages/relief/ReliefTeamsPage'));

// Lazy-loaded Field Unit Pages
const FieldDashboard = lazy(() => import('./pages/field/FieldDashboard'));
const FieldMissions = lazy(() => import('./pages/field/FieldMissions'));
const FieldAlerts = lazy(() => import('./pages/field/FieldAlerts'));
const FieldProfile = lazy(() => import('./pages/field/FieldProfile'));

function PageFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid var(--border, #333)',
        borderTop: '3px solid var(--primary, #3b82f6)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
    </div>
  );
}

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
          <Suspense fallback={<PageFallback />}>
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
                  <Route path="/dashboard" element={<UserDashboard />} />
                  <Route path="/reports" element={<UserReports />} />
                  <Route path="/alerts" element={<UserAlerts />} />
                  <Route path="/profile" element={<UserProfile />} />
                  {/* Backward-compatibility aliases */}
                  <Route path="/user/dashboard" element={<UserDashboard />} />
                  <Route path="/user/reports" element={<UserReports />} />
                  <Route path="/user/alerts" element={<UserAlerts />} />
                  <Route path="/user/profile" element={<UserProfile />} />
                </Route>
              </Route>

              {/* Relief Admin routes */}
              <Route element={<ProtectedRoute allowedRoles={['relief_admin']} />}>
                <Route element={<ReliefLayout />}>
                  <Route path="/relief/dashboard" element={<ReliefDashboard />} />
                  <Route path="/relief/incidents" element={<ActiveIncidentsPage />} />
                  <Route path="/relief/alerts" element={<ReliefAlertsPage />} />
                  <Route path="/relief/reports" element={<ReliefReportsPage />} />
                  <Route path="/relief/teams" element={<ReliefTeamsPage />} />
                  {/* Backward-compatibility aliases */}
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
                  <Route path="/field/mission" element={<FieldDashboard />} />
                  <Route path="/field/incidents" element={<FieldMissions />} />
                  <Route path="/field/dashboard" element={<FieldDashboard />} />
                  <Route path="/field/missions" element={<FieldMissions />} />
                  <Route path="/field/alerts" element={<FieldAlerts />} />
                  <Route path="/field/profile" element={<FieldProfile />} />
                </Route>
              </Route>

              {/* Catch all redirect */}
              <Route path="*" element={<DefaultRedirect />} />
            </Routes>
          </Suspense>
          <MobileNavWrapper />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
