import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { normalizeCampusIdentity } from '../services/authService';
import { completePasswordResetByCode, verifyResetPasswordCode } from '../services/emailService';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const emailFromUrl = searchParams.get('email');
    if (emailFromUrl) {
      const normalized = normalizeCampusIdentity(emailFromUrl);
      setEmail(normalized || emailFromUrl);
    }
  }, [searchParams]);

  const verifyCode = () => {
    setError('');
    setSuccess('');
    try {
      const normalizedEmail = normalizeCampusIdentity(email);
      if (!normalizedEmail) {
        setError('Use IT12345678 or IT12345678@my.sliit.lk.');
        return;
      }
      setLoading(true);
      verifyResetPasswordCode({ email: normalizedEmail, code });
      setEmail(normalizedEmail);
      setCodeVerified(true);
      setSuccess('Code verified. Set your new password.');
    } catch (verifyError) {
      setError(verifyError.message || 'Invalid reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const normalizedEmail = normalizeCampusIdentity(email);
      if (!normalizedEmail) {
        setError('Use IT12345678 or IT12345678@my.sliit.lk.');
        return;
      }
      setLoading(true);
      completePasswordResetByCode({ email: normalizedEmail, code, newPassword });
      setEmail(normalizedEmail);
      setSuccess('Password updated successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (resetError) {
      setError(resetError.message || 'Failed to reset password.');
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
              alt="Students collaborating in a modern campus study space"
              className="login-showcase-image"
            />
            <div className="login-showcase-overlay" />
          </div>
        </section>

        <section className="login-panel">
          <div className="login-panel-header">
            <Link to="/login" className="register-back-link">
              <ArrowLeft size={16} />
              Back to login
            </Link>
            <p className="login-panel-kicker">Password Recovery</p>
            <h2>Set a new password</h2>
            <p className="login-panel-text">Choose a strong password for your account.</p>
          </div>

          {error && <div className="glass-error">{error}</div>}
          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {success}
            </div>
          )}

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
                  onChange={(event) => setEmail(event.target.value)}
                  onBlur={() => {
                    const normalized = normalizeCampusIdentity(email);
                    if (normalized) {
                      setEmail(normalized);
                    }
                  }}
                  required
                />
              </div>
            </div>

            <div className="glass-field">
              <label className="glass-label login-label">Reset code</label>
              <div className="glass-input-wrap">
                <span className="glass-input-icon login-input-icon" aria-hidden="true">
                  <Lock size={18} />
                </span>
                <input
                  type="text"
                  className="glass-input login-input"
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  required
                />
              </div>
            </div>

            {!codeVerified && (
              <button type="button" onClick={verifyCode} disabled={loading} className="btn-primary login-submit">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify code
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            )}

            {codeVerified && (
              <>
            <div className="glass-field">
              <label className="glass-label login-label">New password</label>
              <div className="glass-input-wrap">
                <span className="glass-input-icon login-input-icon" aria-hidden="true">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="glass-input glass-input-password login-input"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="glass-password-toggle login-password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="glass-field">
              <label className="glass-label login-label">Confirm password</label>
              <div className="glass-input-wrap">
                <span className="glass-input-icon login-input-icon" aria-hidden="true">
                  <Lock size={18} />
                </span>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="glass-input glass-input-password login-input"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="glass-password-toggle login-password-toggle"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary login-submit">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  Update password
                  <ArrowRight size={18} />
                </>
              )}
            </button>
              </>
            )}
          </form>
        </section>
      </div>
    </div>
  );
};

export default ResetPassword;
