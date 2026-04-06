import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Eye, EyeOff, Loader2, Lock, Shield } from 'lucide-react';
import { changePassword, getUser, setUser } from '../services/authService';

const getStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (password.length >= 12) score += 1;
  return score;
};

const strengthMeta = [
  { label: 'Weak', color: 'bg-red-500' },
  { label: 'Fair', color: 'bg-orange-500' },
  { label: 'Good', color: 'bg-amber-500' },
  { label: 'Strong', color: 'bg-green-500' },
];

const ForceChangePasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useMemo(() => getUser(), []);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/staff/login', { replace: true });
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (completed) {
      return undefined;
    }

    const blockUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const lockHistory = () => {
      window.history.pushState(null, '', window.location.href);
    };

    const blockBack = () => {
      lockHistory();
    };

    lockHistory();
    window.addEventListener('beforeunload', blockUnload);
    window.addEventListener('popstate', blockBack);

    return () => {
      window.removeEventListener('beforeunload', blockUnload);
      window.removeEventListener('popstate', blockBack);
    };
  }, [completed]);

  const requirements = {
    minLength: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
  };

  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const allRequirementsMet = Object.values(requirements).every(Boolean) && passwordsMatch;
  const strength = getStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allRequirementsMet) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await changePassword(currentPassword, newPassword, confirmPassword);

      const updatedUser = {
        ...currentUser,
        mustChangePassword: false,
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setCompleted(true);
      setSuccess('Password updated successfully. Redirecting...');

      const target = updatedUser.role === 'ADMIN' ? '/admin/dashboard' : '/technician/dashboard';
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const fieldBaseClass =
    'w-full bg-white/5 border border-white/10 text-white rounded-lg pl-10 pr-10 py-2.5 placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 outline-none';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6 py-10">
      <div className="max-w-sm w-full backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-4">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/15 border border-indigo-400/30 mx-auto flex items-center justify-center">
            <Shield className="h-6 w-6 text-indigo-400" />
          </div>
          <h1 className="text-white font-bold text-xl mt-4">Set Your Password</h1>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
          <p className="text-amber-300 text-sm">
            {'⚠ You are using a temporary password. Please set a new secure password to continue.'}
          </p>
        </div>

        {location.state?.username && (
          <p className="text-slate-400 text-xs mb-4">
            Account: <span className="text-slate-200">{location.state.username}</span>
          </p>
        )}

        {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-red-300 text-sm">{error}</div>}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-4 text-green-300 text-sm">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">Current Password</label>
            <div className="relative">
              <Lock className="h-4 w-4 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={fieldBaseClass}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                onClick={() => setShowCurrentPassword((v) => !v)}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">New Password</label>
            <div className="relative">
              <Lock className="h-4 w-4 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={fieldBaseClass}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                onClick={() => setShowNewPassword((v) => !v)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="mt-2">
              <div className="grid grid-cols-4 gap-1.5">
                {strengthMeta.map((segment, index) => (
                  <div key={segment.label} className="h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${index < strength ? segment.color : 'bg-transparent'}`}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Strength: {strength === 0 ? 'Weak' : strengthMeta[strength - 1].label}
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="h-4 w-4 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={fieldBaseClass}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                onClick={() => setShowConfirmPassword((v) => !v)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              {passwordsMatch && <CheckCircle2 className="h-4 w-4 text-green-400 absolute right-10 top-1/2 -translate-y-1/2" />}
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-2 text-sm">
              {requirements.minLength ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Circle className="h-3 w-3 text-slate-500" />}
              <span className={requirements.minLength ? 'text-green-300' : 'text-slate-400'}>At least 8 characters</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {requirements.uppercase ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Circle className="h-3 w-3 text-slate-500" />}
              <span className={requirements.uppercase ? 'text-green-300' : 'text-slate-400'}>One uppercase letter</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {requirements.number ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Circle className="h-3 w-3 text-slate-500" />}
              <span className={requirements.number ? 'text-green-300' : 'text-slate-400'}>One number</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!allRequirementsMet || loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg py-2.5 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Set Password & Continue'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForceChangePasswordPage;
