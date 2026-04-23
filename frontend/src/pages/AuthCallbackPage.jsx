import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setToken, setUser } from '../services/authService';
import { useAuth } from '../context/AuthContextObject';

const AuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser: setAuthUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      // Handle error
      console.error('OAuth error:', error);
      navigate('/login?error=' + encodeURIComponent(error));
      return;
    }

    if (token && userStr) {
      try {
        // Store token and user data
        setToken(token);
        const user = JSON.parse(decodeURIComponent(userStr));
        setUser(user);
        setAuthUser(user);

        // Redirect to dashboard
        if (user?.role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else if (user?.role === 'TECHNICIAN') {
          navigate('/technician/dashboard');
        } else {
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('Failed to parse user data:', err);
        navigate('/login?error=Authentication failed');
      }
    } else {
      navigate('/login?error=Missing authentication data');
    }
  }, [searchParams, navigate, setAuthUser]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#F8FAFC_45%,_#EEF2FF_100%)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700" />
        <h2 className="text-xl font-bold text-slate-900">Authenticating...</h2>
        <p className="mt-2 text-sm text-slate-600">Please wait while we complete your login.</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
