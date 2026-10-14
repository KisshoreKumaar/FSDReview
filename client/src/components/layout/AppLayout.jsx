import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Sidebar from './Sidebar.jsx';
import ErrorBoundary from '../common/ErrorBoundary.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AppLayout() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Navbar onMenuClick={() => setMenuOpen((v) => !v)} />
      <div className="flex">
        <Sidebar role={user?.role} open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="min-w-0 flex-1 px-3 py-5 sm:px-6 sm:py-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
