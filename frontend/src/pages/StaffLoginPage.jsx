import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { setToken, setUser as persistUser, staffLogin } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const StaffLoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await staffLogin(username, password);
      const normalizedUser = {
        ...response,
        isStaff: true,
      };
      setToken(response.token);
      persistUser(normalizedUser);
      setUser(normalizedUser);

      if (response.mustChangePassword) {
        navigate('/staff/change-password', {
          state: { forced: true, username: response.username },
        });
      } else {
        navigate(response.role === 'ADMIN' ? '/admin/dashboard' : '/technician/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staff-login-page auth-glass-page">
      <div className="glass-card">
        <div className="staff-logo-wrap">
          <img
            src="/sliit-campus-logo-.png"
            alt="SLIIT Logo"
            className="staff-logo"
          />
        </div>

        <div className="glass-badge-wrap">
          <span className="staff-badge">Staff Access Only</span>
        </div>

        <h1 className="glass-title">Smart Campus</h1>
        <p className="glass-subtitle">Staff Portal</p>
        <p className="glass-caption">Sign in with your staff credentials</p>

        {error && <div className="glass-error">{error}</div>}

        <form onSubmit={handleLogin} className="glass-form">
          <div className="glass-field">
            <label className="glass-label">STAFF USERNAME</label>
            <div className="glass-input-wrap">
              <span className="glass-input-icon" aria-hidden="true">👤</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="glass-input"
                placeholder="e.g. tech.kamal"
                required
              />
            </div>
          </div>

          <div className="glass-field">
            <label className="glass-label">PASSWORD</label>
            <div className="glass-input-wrap">
              <span className="glass-input-icon" aria-hidden="true">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input glass-input-password"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="glass-password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              '🚀 Sign In'
            )}
          </button>
        </form>

        <p className="glass-footer-text">
          Need student login?{' '}
          <button type="button" onClick={() => navigate('/login')} className="glass-teal-link glass-link-button">
            Back to student login
          </button>
        </p>

        <p className="glass-legal-text">Authorized staff access only. All actions are logged and monitored.</p>
      </div>
    </div>
  );
};

export default StaffLoginPage;
