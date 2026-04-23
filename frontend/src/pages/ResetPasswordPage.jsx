import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { isValidCampusEmail } from '../services/authService';
import { completePasswordReset, sendResetPasswordCode, verifyResetPasswordCode } from '../services/emailService';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const sendCode = async () => {
    setError('');
    setSuccess('');
    if (!isValidCampusEmail(email)) {
      setError('Use a valid campus email (e.g., IT12345678@my.sliit.lk).');
      return;
    }

    try {
      setLoading(true);
      await sendResetPasswordCode({ email });
      setCodeSent(true);
      setSuccess('Reset code sent to your email.');
    } catch (sendError) {
      setError(sendError.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setError('');
    setSuccess('');
    try {
      setLoading(true);
      verifyResetPasswordCode({ email, code });
      setCodeVerified(true);
      setSuccess('Code verified. You can set your new password.');
    } catch (verifyError) {
      setError(verifyError.message || 'Invalid code.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setError('');
    setSuccess('');
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await completePasswordReset({ email, code, newPassword });
      setSuccess('Password reset successful. Please login with your new password.');
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
            <p className="login-panel-kicker">Account Recovery</p>
            <h2>Reset your password</h2>
            <p className="login-panel-text">Send code, verify code, then set a new password.</p>
          </div>

          {error && <div className="glass-error">{error}</div>}
          {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>}

          <div className="glass-form login-form">
            <div className="glass-field">
              <label className="glass-label login-label">Campus email</label>
              <div className="glass-input-wrap">
                <span className="glass-input-icon login-input-icon" aria-hidden="true">
                  <Mail size={18} />
                </span>
                <input
                  type="email"
                  className="glass-input login-input"
                  placeholder="IT12345678@my.sliit.lk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {codeSent && (
              <div className="glass-field">
                <label className="glass-label login-label">Verification code</label>
                <div className="glass-input-wrap">
                  <span className="glass-input-icon login-input-icon" aria-hidden="true">
                    <Lock size={18} />
                  </span>
                  <input
                    type="text"
                    maxLength={6}
                    className="glass-input login-input"
                    placeholder="Enter 6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  />
                </div>
              </div>
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
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
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
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="glass-password-toggle login-password-toggle"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {!codeSent && (
              <button type="button" onClick={sendCode} disabled={loading} className="btn-primary login-submit">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending code...
                  </>
                ) : (
                  <>
                    Send reset code
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            )}

            {codeSent && !codeVerified && (
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
              <button type="button" onClick={resetPassword} disabled={loading} className="btn-primary login-submit">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    Set new password
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

