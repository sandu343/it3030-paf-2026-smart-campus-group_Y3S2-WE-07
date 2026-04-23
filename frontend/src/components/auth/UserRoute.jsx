import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContextObject';

const UserRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-6 text-slate-500">Loading...</div>;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'USER') return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
};

export default UserRoute;
