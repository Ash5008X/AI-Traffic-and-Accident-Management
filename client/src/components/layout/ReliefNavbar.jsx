import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NAV_BY_ROLE } from '../../utils/constants';
import { useState, useEffect } from 'react';
import Icon from '../common/Icon';
import './Navbar.css';

export default function ReliefNavbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navItems = NAV_BY_ROLE.relief_admin;

  const firstName = user?.firstName || (user?.name ? user.name.split(' ')[0] : 'Admin');

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  const [clock, setClock] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      setClock(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} UTC`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

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
        <div className="fira-code" style={{ fontSize: '14px', color: 'var(--nt-dim)' }}>
          {clock}
        </div>

        <button className="icon-btn" title="Notifications" style={{ position: 'relative' }}>
          <Icon name="notifications" style={{ color: 'var(--nt-dim)' }} />
        </button>

        <div className="relief-user-profile">
          <span className="outfit" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--nt-bright)' }}>
            {firstName.toUpperCase()}
          </span>
          <div className="user-avatar small">
            {initials}
          </div>
          <div className="profile-dropdown">
            <button onClick={logout} className="dropdown-item">
              <Icon name="logout" size={16} />
              Sign Out
            </button>
          </div>
        </div>

        <button className="theme-btn" onClick={toggleTheme} title="Toggle theme">
          <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} />
        </button>
      </div>
    </nav>
  );
}
