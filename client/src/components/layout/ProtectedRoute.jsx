import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import Spinner from '../common/Spinner.jsx';

export default function ProtectedRoute({ roles }) {
  const { user, booting } = useAuth();
  const location = useLocation();

  if (booting) return <Spinner label="Checking your session…" className="min-h-screen" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/forbidden" replace />;

  return <Outlet />;
}
