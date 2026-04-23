import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContextObject';
import { isAuthenticated, hasRole } from '../services/authService';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#F8FAFC_45%,_#EEF2FF_100%)] px-4">
        <div className="w-full max-w-sm rounded-2xl border border-blue-100 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700" />
          <p className="text-sm font-semibold text-slate-800">Checking your session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
