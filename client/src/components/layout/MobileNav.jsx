import { NavLink } from 'react-router-dom';
import { NAV_BY_ROLE } from '../../utils/constants';
import Icon from '../common/Icon';
import './Navbar.css';

export default function MobileNav({ role = 'user' }) {
  const navItems = NAV_BY_ROLE[role] || NAV_BY_ROLE.user;

  return (
    <nav className="mobile-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `mob-btn ${isActive ? 'active' : ''}`}
        >
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
