import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, Sparkles } from 'lucide-react';
import { login, googleLogin, isValidCampusIdentity, normalizeCampusIdentity } from '../services/authService';
import { isEmailPendingVerification, isEmailVerified } from '../services/emailService';
import { useAuth } from '../context/AuthContextObject';

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });

  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      setError(decodeURIComponent(oauthError));
      return;
    }
    const verified = searchParams.get('verified');
    if (verified === '1') {
      setNotice('Email verified successfully. Please log in.');
    }
  }, [searchParams]);

  const validateEmail = (val) => {
    if (!val) return 'Campus email or ID is required';
    if (!isValidCampusIdentity(val)) return 'Use IT12345678 or IT12345678@my.sliit.lk';
    return '';
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'email') {
      setEmailError(validateEmail(email));
      const normalized = normalizeCampusIdentity(email);
      if (normalized) {
        setEmail(normalized);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');

    const eError = validateEmail(email);
    if (eError) {
      setEmailError(eError);
      setTouched((prev) => ({ ...prev, email: true }));
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setTouched((prev) => ({ ...prev, password: true }));
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = normalizeCampusIdentity(email);
      if (!normalizedEmail) {
        setEmailError('Use IT12345678 or IT12345678@my.sliit.lk');
        setTouched((prev) => ({ ...prev, email: true }));
        setLoading(false);
        return;
      }
      if (isEmailPendingVerification(normalizedEmail) && !isEmailVerified(normalizedEmail)) {
        setError('Please verify your email before logging in.');
        setLoading(false);
        return;
      }
      const response = await login(normalizedEmail, password);
      setUser(response.user);

      if (response.user?.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (response.user?.role === 'TECHNICIAN') {
        navigate('/technician/dashboard');
      } else {
        sessionStorage.setItem('showLocationPrompt', 'true');
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await googleLogin();
    } catch (err) {
      setError(err.message || 'Google login failed.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <section className="login-showcase">
          <div className="login-showcase-image-wrap">
            <img
              src="/login.png"
              alt="Students collaborating in a modern campus study space"
              className="login-showcase-image"
            />
            <div className="login-showcase-overlay" />
          </div>

          <div className="login-showcase-content">
            <div className="login-showcase-chip">
              <Sparkles size={14} />
              Smart Campus Experience
            </div>

            <div className="login-showcase-copy">
              <p className="login-showcase-eyebrow">SLIIT Student Portal</p>
              <h1>Learn, book, report, and manage campus life from one place.</h1>
              <p>
                Access your timetable tools, issue reporting, bookings, and alerts with your campus account.
              </p>
            </div>

            <div className="login-showcase-stats">
              <div className="login-showcase-stat">
                <strong>24/7</strong>
                <span>Student access</span>
              </div>
              <div className="login-showcase-stat">
                <strong>One</strong>
                <span>Unified workspace</span>
              </div>
              <div className="login-showcase-stat">
                <strong>Fast</strong>
                <span>Google sign in</span>
              </div>
            </div>
          </div>
        </section>

        <section className="login-panel">
          <div className="login-panel-header">
            <p className="login-panel-kicker">Welcome back</p>
            <h2>Sign in to Smart Campus</h2>
            <p className="login-panel-text">Use your SLIIT student email to continue to your workspace.</p>
          </div>

          {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}
          {error && <div className="glass-error">{error}</div>}

          <form onSubmit={handleSubmit} className="glass-form login-form">
            <div className="glass-field">
              <label className="glass-label login-label">Campus email or ID</label>
              <div className="glass-input-wrap">
                <span className="glass-input-icon login-input-icon" aria-hidden="true">
                  <Mail size={18} />
                </span>
                <input
                  type="text"
                  className="glass-input login-input"
                  placeholder="IT12345678 or IT12345678@my.sliit.lk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  required
                />
              </div>
              {emailError && touched.email && <p className="glass-inline-error">{emailError}</p>}
            </div>

            <div className="glass-field">
              <div className="glass-label-row">
                <label className="glass-label login-label">Password</label>
                <Link to="/forgot-password" className="glass-helper-link login-helper-link">Recovery?</Link>
              </div>
              <div className="glass-input-wrap">
                <span className="glass-input-icon login-input-icon" aria-hidden="true">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="glass-input glass-input-password login-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
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
              {touched.password && password.length < 8 && (
                <p className="glass-inline-error">Password must be at least 8 characters</p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary login-submit">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="glass-divider login-divider">
            <div className="glass-divider-line" />
            <span>OR</span>
            <div className="glass-divider-line" />
          </div>

          <button className="btn-google login-google" onClick={handleGoogleLogin}>
            <img src="https://www.google.com/favicon.ico" width="18" alt="Google" />
            Continue with Google
          </button>

          <p className="glass-footer-text login-footer-text">
            Don't have an account?{' '}
            <Link to="/register" className="glass-teal-link">
              Create account
            </Link>
          </p>

          <p className="glass-legal-text login-legal-text">
            By signing in, you agree to the Smart Campus terms of use and privacy policy.
          </p>
        </section>
      </div>
    </div>
  );
};

export default LoginPage;
