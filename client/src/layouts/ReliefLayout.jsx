import { Outlet } from 'react-router-dom';
import ReliefNavbar from '../components/layout/ReliefNavbar';
import SystemFooter from '../components/layout/SystemFooter';

export default function ReliefLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--nt-body-bg)' }}>
      <ReliefNavbar />
      <Outlet />
      <SystemFooter />
    </div>
  );
}
