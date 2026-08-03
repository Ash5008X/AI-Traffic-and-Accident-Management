import { Outlet } from 'react-router-dom';
import FieldNavbar from '../components/layout/FieldNavbar';

export default function FieldLayout() {
  return (
    <div style={{ background: 'var(--nt-body-bg)', minHeight: '100vh' }}>
      <FieldNavbar />
      <Outlet />
    </div>
  );
}
