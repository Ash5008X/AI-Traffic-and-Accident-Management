import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NAV_BY_ROLE } from '../../utils/constants';
import Icon from '../common/Icon';
import './Navbar.css';

export default function UserNavbar() {
  const { user, logout, getDashboardPath } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navItems = NAV_BY_ROLE.user;

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <header className="navbar">
      <div className="navbar-left">
        <NavLink to={getDashboardPath('user')} className="brand">
          <div className="brand-mark">
            <Icon name="traffic" />
          </div>
          <span className="brand-name">NexusTraffic</span>
        </NavLink>

        <nav>
          <ul className="nav-links">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="navbar-right">
        <div className="search-wrap">
          <Icon name="search" className="search-icon-el" />
          <input className="search-input" type="text" placeholder="Search incidents…" />
        </div>

        <button className="icon-btn" title="Notifications">
          <Icon name="notifications" />
          <span className="notif-dot" />
        </button>

        <div className="divider-v" />

        <button
          className="theme-btn"
          onClick={toggleTheme}
          title="Toggle theme"
          aria-label="Toggle light/dark mode"
        >
          <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} />
        </button>

        <div className="user-avatar" title="My Profile">
          {initials}
        </div>
      </div>
    </header>
  );
}
