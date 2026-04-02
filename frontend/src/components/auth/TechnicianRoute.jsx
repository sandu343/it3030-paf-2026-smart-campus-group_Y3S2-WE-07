import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TechnicianRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-6 text-slate-500">Loading...</div>;
  }

  if (!user) return <Navigate to="/staff/login" replace />;
  if (user.role !== 'TECHNICIAN') return <Navigate to="/unauthorized" replace />;
  if (user.mustChangePassword) return <Navigate to="/staff/change-password" replace />;

  return <Outlet />;
};

export default TechnicianRoute;
