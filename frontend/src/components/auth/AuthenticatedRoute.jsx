import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AuthenticatedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-6 text-slate-500">Loading...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default AuthenticatedRoute;
