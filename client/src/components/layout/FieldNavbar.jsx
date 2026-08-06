import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import { NAV_BY_ROLE } from '../../utils/constants';
import Icon from '../common/Icon';
import NotificationDropdown from '../common/NotificationDropdown';
import './Navbar.css';

export default function FieldNavbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const navItems = NAV_BY_ROLE.field_unit;

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'FU';

  return (
    <nav className="relief-navbar">
      <div className="relief-navbar-left">
        <div className="nt-brand-logo">
          <span style={{ color: 'var(--nt-bright)' }}>NEXUS</span>
          <span style={{ color: '#F97316' }}>TRAFFIC</span>
        </div>
      </div>

      <div className="relief-navbar-center">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `relief-nav-link outfit ${isActive ? 'active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="relief-navbar-right">
        <div style={{ position: 'relative' }}>
          <button 
            className="icon-btn" 
            title="Notifications"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
          >
            <Icon name="notifications" style={{ color: 'var(--nt-dim)' }} />
            {unreadCount > 0 && (
              <span className="notif-badge">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <NotificationDropdown isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
        </div>

        <button className="theme-btn" onClick={toggleTheme} title="Toggle theme">
          <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} />
        </button>

        <div className="relief-user-profile">
          <div className="user-avatar small">{initials}</div>
          <div className="profile-dropdown">
            <button onClick={logout} className="dropdown-item">
              <Icon name="logout" size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
