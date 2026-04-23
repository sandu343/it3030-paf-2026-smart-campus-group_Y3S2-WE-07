import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, Send } from 'lucide-react';
import { isValidCampusIdentity, normalizeCampusIdentity } from '../services/authService';
import { sendResetPasswordCode } from '../services/emailService';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!isValidCampusIdentity(email)) {
      setError('Use IT12345678 or IT12345678@my.sliit.lk.');
      return;
    }

    try {
      setLoading(true);
      const normalizedEmail = normalizeCampusIdentity(email);
      await sendResetPasswordCode({ email: normalizedEmail });
      setSuccess('Reset code sent. Please check your email.');
      setEmail(normalizedEmail);
      setTimeout(() => navigate(`/reset-password?email=${encodeURIComponent(normalizedEmail)}`), 800);
    } catch (sendError) {
      setError(sendError.message || 'Failed to send reset email.');
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
            <h2>Forgot your password?</h2>
            <p className="login-panel-text">Enter your campus email or ID and we will send a reset link.</p>
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

            <button type="submit" disabled={loading} className="btn-primary login-submit">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  Send reset link
                  <Send size={18} />
                </>
              )}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default ForgotPassword;
