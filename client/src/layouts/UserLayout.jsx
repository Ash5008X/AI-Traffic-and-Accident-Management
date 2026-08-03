import { Outlet } from 'react-router-dom';
import UserNavbar from '../components/layout/UserNavbar';
import '../styles/user.css';

export default function UserLayout() {
  return (
    <>
      <UserNavbar />
      <Outlet />
    </>
  );
}
