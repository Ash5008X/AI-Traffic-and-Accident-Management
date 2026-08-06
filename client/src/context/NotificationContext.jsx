import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';
import socketManager from '../services/socket';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const { isAuthenticated, token } = useAuth(); // Depend on token to fetch

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      if (Array.isArray(res)) {
        setNotifications(res);
      }
    } catch (err) {
      console.error('[NotificationContext] Failed to fetch notifications:', err);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchNotifications();

      // Handle new notification: optimistic prepend instead of full re-fetch
      const handleNewNotification = (notif) => {
        if (notif && notif._id) {
          setNotifications((prev) => {
            // Avoid duplicates
            if (prev.some((n) => n._id === notif._id)) return prev;
            return [notif, ...prev];
          });
        } else {
          // Fallback: re-fetch if notification data is incomplete
          fetchNotifications();
        }
      };

      // Auto-refresh notifications when incidents change
      socketManager.on('incident:updated', fetchNotifications);
      socketManager.on('incident:new', fetchNotifications);
      socketManager.on('notification:new', handleNewNotification);

      return () => {
        socketManager.off('incident:updated', fetchNotifications);
        socketManager.off('incident:new', fetchNotifications);
        socketManager.off('notification:new', handleNewNotification);
      };
    } else {
      setNotifications([]);
    }
  }, [isAuthenticated, token, fetchNotifications]);

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('[NotificationContext] Failed to mark all as read:', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n._id === id ? { ...n, isRead: true } : n
      ));
    } catch (err) {
      console.error('[NotificationContext] Failed to mark as read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      markAllAsRead,
      markAsRead,
      fetchNotifications 
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
