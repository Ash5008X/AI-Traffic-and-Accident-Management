import { createContext, useState, useEffect, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AUTH_KEY, DASHBOARD_BY_ROLE } from '../utils/constants';

const AuthContext = createContext(null);

function normalizeRole(role) {
  if (!role) return '';
  return String(role).trim().toLowerCase().replace(/-/g, '_');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.token && parsed?.user) {
          setToken(parsed.token);
          setUser(parsed.user);
        }
      }
    } catch {
      localStorage.removeItem(AUTH_KEY);
    }
    setLoading(false);
  }, []);

  const saveAuth = useCallback((data) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(data));
    setToken(data.token);
    setUser(data.user);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    saveAuth(data);
    return data;
  }, [saveAuth]);

  const register = useCallback(async (payload) => {
    const data = await api.post('/auth/register', {
      ...payload,
      role: normalizeRole(payload.role),
    });
    saveAuth(data);
    return data;
  }, [saveAuth]);

  const fetchMe = useCallback(async () => {
    const userData = await api.get('/auth/me');
    const currentToken = JSON.parse(localStorage.getItem(AUTH_KEY))?.token;
    if (currentToken) {
      const authData = { token: currentToken, user: userData };
      saveAuth(authData);
    }
    return userData;
  }, [saveAuth]);

  const updateLocation = useCallback(async (location) => {
    await api.patch('/auth/update-location', { location });
    // Update local user data
    setUser((prev) => {
      if (prev) {
        const updated = { ...prev, location };
        const currentToken = JSON.parse(localStorage.getItem(AUTH_KEY))?.token;
        if (currentToken) {
          localStorage.setItem(AUTH_KEY, JSON.stringify({ token: currentToken, user: updated }));
        }
        return updated;
      }
      return prev;
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem('nexustraffic_notifs_read_at');
    setToken(null);
    setUser(null);
  }, []);

  const getDashboardPath = useCallback((role) => {
    return DASHBOARD_BY_ROLE[normalizeRole(role)] || '/login';
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    role: normalizeRole(user?.role),
    login,
    register,
    fetchMe,
    updateLocation,
    logout,
    getDashboardPath,
    normalizeRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
