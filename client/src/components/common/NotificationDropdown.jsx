import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import Icon from './Icon';
import './NotificationDropdown.css';

const ICON_MAP = {
  incident: 'crisis_alert',
  assignment: 'assignment_ind',
  update: 'update',
  system: 'info',
  alert: 'warning',
  broadcast: 'campaign',
  default: 'notifications'
};

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationDropdown({ isOpen, onClose }) {
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // Also check if they clicked the bell button (which we can identify by checking closest)
        if (!event.target.closest('.icon-btn')) {
          onClose();
        }
      }
    }
    
    // Close on Escape key
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      markAsRead(notif._id);
    }
    onClose();

    // Navigate to relevant page if possible
    if (notif.relatedIncident) {
      navigate('/dashboard'); 
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notif-dropdown" ref={dropdownRef}>
      <div className="notif-header">
        <h4>Notifications</h4>
        {unreadCount > 0 && <span className="notif-unread-count">({unreadCount} New)</span>}
      </div>

      <div className="notif-list">
        {notifications.length === 0 ? (
          <div className="notif-empty">
            <Icon name="notifications_off" size={48} />
            <p>No notifications yet</p>
            <span>You're all caught up.</span>
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif._id} 
              className={`notif-item ${notif.isRead ? 'read' : 'unread'}`}
              onClick={() => handleNotificationClick(notif)}
            >
              <div className="notif-icon-wrap">
                <Icon name={ICON_MAP[notif.type] || ICON_MAP.default} />
              </div>
              <div className="notif-content">
                <div className="notif-title-row">
                  <span className="notif-title">{notif.title || 'Notification'}</span>
                  {!notif.isRead && <span className="notif-dot-indicator"></span>}
                </div>
                <p className="notif-message">{notif.message || notif.content}</p>
                {/* Broadcast metadata */}
                {notif.broadcastId && (
                  <div className="notif-broadcast-meta">
                    <span className="notif-broadcast-id">ID: {notif.broadcastId}</span>
                    {notif.targetZone && (
                      <span className="notif-broadcast-zone">Target: {notif.targetZone}</span>
                    )}
                  </div>
                )}
                <span className="notif-time">{formatTimeAgo(notif.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <div className="notif-footer">
          <button className="notif-mark-read" onClick={markAllAsRead}>
            Mark all as read
          </button>
        </div>
      )}
    </div>
  );
}
