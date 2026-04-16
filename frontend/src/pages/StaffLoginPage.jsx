import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Shield, User } from 'lucide-react';
import { setToken, setUser as persistUser, staffLogin } from '../services/authService';
import { useAuth } from '../context/AuthContextObject';

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
      setError(err.response?.data?.message || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <section className="login-showcase">
          <div className="login-showcase-image-wrap">
            <img
              src="/login.png"
              alt="Staff managing campus operations"
              className="login-showcase-image"
            />
            <div className="login-showcase-overlay" />
          </div>

          <div className="login-showcase-content">
            <div className="login-showcase-chip">
              <Shield size={14} />
              Authorized Staff Portal
            </div>

            <div className="login-showcase-copy">
              <p className="login-showcase-eyebrow">Smart Campus Staff Access</p>
              <h1>Manage support operations and campus workflows securely.</h1>
              <p>
                Sign in as an administrator or technician to monitor incidents, resolve requests, and manage services.
              </p>
            </div>

            <div className="login-showcase-stats">
              <div className="login-showcase-stat">
                <strong>Secure</strong>
                <span>Role-based access</span>
              </div>
              <div className="login-showcase-stat">
                <strong>Live</strong>
                <span>Operational insights</span>
              </div>
              <div className="login-showcase-stat">
                <strong>Fast</strong>
                <span>Ticket response flow</span>
              </div>
            </div>
          </div>
        </section>

        <section className="login-panel">
          <div className="login-panel-header">
            <p className="login-panel-kicker">Staff Sign In</p>
            <h2>Access Smart Campus</h2>
            <p className="login-panel-text">Use your staff credentials to continue to the operations portal.</p>
          </div>

          {error && <div className="glass-error">{error}</div>}

          <form onSubmit={handleLogin} className="glass-form login-form">
            <div className="glass-field">
              <label className="glass-label login-label">Staff username</label>
              <div className="glass-input-wrap">
                <span className="glass-input-icon login-input-icon" aria-hidden="true">
                  <User size={18} />
                </span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="glass-input login-input"
                  placeholder="e.g. tech.kamal"
                  required
                />
              </div>
            </div>

            <div className="glass-field">
              <label className="glass-label login-label">Password</label>
              <div className="glass-input-wrap">
                <span className="glass-input-icon login-input-icon" aria-hidden="true">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass-input glass-input-password login-input"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="glass-password-toggle login-password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary login-submit">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="glass-footer-text login-footer-text">
            Need student login?{' '}
            <button type="button" onClick={() => navigate('/login')} className="glass-teal-link glass-link-button">
              Back to student login
            </button>
          </p>

          <p className="glass-legal-text login-legal-text">
            Authorized staff access only. All actions are logged and monitored.
          </p>
        </section>
      </div>
    </div>
  );
};

export default StaffLoginPage;
