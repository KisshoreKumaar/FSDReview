import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLE_LABELS } from '../../constants/roles.js';
import Button from '../common/Button.jsx';
import NotificationBell from './NotificationBell.jsx';

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-3 sm:px-5">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Toggle navigation"
        >
          ☰
        </button>

        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            CA
          </span>
          <span className="hidden text-sm font-semibold text-slate-900 sm:block">College Admissions</span>
        </Link>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <NotificationBell />
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-tight text-slate-800">{user?.name}</p>
            <p className="text-xs text-slate-500">{ROLE_LABELS[user?.role] || ''}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={logout}>
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
