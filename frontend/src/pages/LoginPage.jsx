import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { login, googleLogin, isValidCampusEmail } from '../services/authService';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });

  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    // Check for OAuth error in URL
    const oauthError = searchParams.get('error');
    if (oauthError) {
      setError(decodeURIComponent(oauthError));
    }
  }, [searchParams]);

  const normalizeLoginEmail = (value) => {
    const trimmed = value.trim();
    const match = trimmed.match(/^([A-Za-z]{2})(\d{8})@my\.sliit\.lk$/i);

    if (!match) {
      return trimmed;
    }

    const [, prefix, digits] = match;
    return `${prefix.toUpperCase()}${digits}@my.sliit.lk`;
  };

  const validateEmail = (val) => {
    if (!val) return 'Email is required';
    if (!isValidCampusEmail(val)) return 'Use your @my.sliit.lk email';
    return '';
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    if (field === 'email') {
      setEmailError(validateEmail(email));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const eError = validateEmail(email);
    if (eError) {
      setEmailError(eError);
      setTouched(prev => ({ ...prev, email: true }));
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setTouched(prev => ({ ...prev, password: true }));
      return;
    }

    setLoading(true);

    try {
      const normalizedEmail = normalizeLoginEmail(email);
      const response = await login(normalizedEmail, password);
      setUser(response.user);

      if (response.user?.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (response.user?.role === 'TECHNICIAN') {
        navigate('/technician/dashboard');
      } else {
        sessionStorage.setItem('showLocationPrompt', 'true');//location//location acces permission for users
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
    <div className="login-page auth-glass-page">
      <div className="glass-card login-glass-card">
        <div className="login-logo-wrap">
          <img
            src="/sliit-campus-logo-.png"
            alt="SLIIT Logo"
            className="login-logo"
          />
        </div>

        <h1 className="glass-title">Smart Campus</h1>
        <p className="glass-subtitle">Operations Hub</p>
        <p className="glass-caption">Sign in to access your workspace</p>

        {error && <div className="glass-error">{error}</div>}

        <form onSubmit={handleSubmit} className="glass-form">
          <div className="glass-field">
            <label className="glass-label">CAMPUS EMAIL</label>
            <div className="glass-input-wrap">
              <span className="glass-input-icon" aria-hidden="true">📧</span>
              <input
                type="email"
                className="glass-input"
                placeholder="Use your SLIIT email (@sliit.lk or @my.sliit.lk)"
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
              <label className="glass-label">PASSWORD</label>
              <Link to="#" className="glass-helper-link">Recovery?</Link>
            </div>
            <div className="glass-input-wrap">
              <span className="glass-input-icon" aria-hidden="true">🔒</span>
              <input
                type={showPassword ? 'text' : 'password'}
                className="glass-input glass-input-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="glass-password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {touched.password && password.length < 8 && (
              <p className="glass-inline-error">Password must be at least 8 characters</p>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '🚀 Sign In'}
          </button>
        </form>

        <div className="glass-divider">
          <div className="glass-divider-line" />
          <span>OR</span>
          <div className="glass-divider-line" />
        </div>

        <button className="btn-google" onClick={handleGoogleLogin}>
          <img src="https://www.google.com/favicon.ico" width="18" alt="Google" />
          Continue with Google
        </button>

        <p className="glass-footer-text">
          Don't have an account?{' '}
          <Link to="/register" className="glass-teal-link">
            Create account
          </Link>
        </p>

        <p className="glass-legal-text">
          By signing in, you agree to the Smart Campus terms of use and privacy policy.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
