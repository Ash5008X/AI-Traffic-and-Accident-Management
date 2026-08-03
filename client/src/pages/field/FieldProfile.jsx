import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/common/Icon';
import '../../styles/field.css';

export default function FieldProfile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'FU';

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <div style={{ padding: 32, borderRadius: 8, background: 'var(--nt-card)', border: '1px solid var(--nt-card-border)', textAlign: 'center' }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#F97316',
            color: '#FFF',
            fontFamily: 'Barlow Condensed, sans-serif',
            fontWeight: 800,
            fontSize: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
          }}
        >
          {initials}
        </div>
        <h2 style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, fontSize: 28, color: 'var(--nt-bright)' }}>
          {user?.name || 'Field Operator'}
        </h2>
        <div style={{ fontFamily: 'Fira Code, monospace', fontSize: 12, color: 'var(--nt-dim)', marginTop: 4 }}>
          OPERATOR_ID // NX-{user?._id?.slice(-6).toUpperCase() || '000000'}
        </div>
        <div
          style={{
            display: 'inline-block',
            marginTop: 16,
            padding: '4px 16px',
            borderRadius: 12,
            background: 'rgba(52,199,89,0.2)',
            color: '#34C759',
            fontFamily: 'Fira Code, monospace',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          STATUS: ON-DUTY (SECTOR N)
        </div>

        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(31,52,72,0.4)' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: 14,
              borderRadius: 6,
              background: '#FF3B30',
              color: '#FFF',
              border: 'none',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: '0.06em',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            <Icon name="logout" size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            Sign Out of Terminal
          </button>
        </div>
      </div>
    </div>
  );
}
