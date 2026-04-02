import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const StaffRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-6 text-slate-500">Loading...</div>;
  }

  if (!user) return <Navigate to="/staff/login" replace />;

  const isStaff = user.isStaff || user.role === 'ADMIN' || user.role === 'TECHNICIAN';
  if (!isStaff) return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default StaffRoute;
