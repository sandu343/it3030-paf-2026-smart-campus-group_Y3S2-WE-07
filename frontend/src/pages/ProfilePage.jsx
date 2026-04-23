import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  Loader2,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContextObject';
import { changePassword, getUser } from '../services/authService';

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

const roleBadge = {
  ADMIN: 'bg-indigo-100 text-indigo-700',
  TECHNICIAN: 'bg-blue-100 text-blue-700',
  USER: 'bg-green-100 text-green-700',
};

const ProfilePage = () => {
  const { user: authUser } = useAuth();
  const user = authUser || getUser();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const initials = useMemo(() => {
    const source = user?.fullName || user?.name || 'User';
    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }, [user]);

  const requirements = {
    minLength: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    match: newPassword.length > 0 && newPassword === confirmPassword,
  };
  const allMet = Object.values(requirements).every(Boolean);
  const strength = getStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allMet) return;

    setLoading(true);
    setSuccess('');
    setError('');

    try {
      const response = await changePassword(currentPassword, newPassword, confirmPassword);
      setSuccess(response?.message || 'Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      const stored = getUser();
      if (stored) {
        const updated = { ...stored, mustChangePassword: false };
        localStorage.setItem('smartcampus_user', JSON.stringify(updated));
        localStorage.setItem('user', JSON.stringify(updated));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    'w-full border border-slate-200 rounded-lg pl-3 pr-10 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500';

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-8 px-4">
      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xl flex items-center justify-center">
              {initials || 'U'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{user?.fullName || user?.name || 'Unknown User'}</h1>
              <p className="text-slate-500">{user?.email || user?.username || '-'}</p>
              <span className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${roleBadge[user?.role] || 'bg-slate-100 text-slate-700'}`}>
                {user?.role || 'USER'}
              </span>
            </div>
          </div>
          <button type="button" className="text-indigo-600 text-sm hover:text-indigo-500">
            Edit Profile
          </button>
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'TECHNICIAN') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5 text-sm">
            <div>
              <p className="text-slate-500">Staff ID</p>
              <p className="text-slate-800 font-medium">{user?.staffId || '-'}</p>
            </div>
            <div>
              <p className="text-slate-500">Department</p>
              <p className="text-slate-800 font-medium">{user?.department || '-'}</p>
            </div>
          </div>
        )}
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-2 text-slate-900 font-semibold">
          <Shield className="h-4 w-4" />
          Security
        </div>
        <p className="text-slate-500 text-sm mt-1">Manage your password and account security</p>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="text-sm text-slate-600 mb-1 block">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={fieldClass}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                onClick={() => setShowCurrent((v) => !v)}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={fieldClass}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                onClick={() => setShowNew((v) => !v)}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-2">
              <div className="grid grid-cols-4 gap-1.5">
                {strengthMeta.map((segment, index) => (
                  <div key={segment.label} className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${index < strength ? segment.color : 'bg-transparent'}`}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Strength: {strength === 0 ? 'Weak' : strengthMeta[strength - 1].label}
              </p>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600 mb-1 block">Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={fieldClass}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                onClick={() => setShowConfirm((v) => !v)}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              {requirements.match && <CheckCircle2 className="h-4 w-4 text-green-500 absolute right-10 top-1/2 -translate-y-1/2" />}
            </div>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              {requirements.minLength ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-3 w-3 text-slate-400" />}
              <span className={requirements.minLength ? 'text-green-700' : 'text-slate-500'}>At least 8 characters</span>
            </div>
            <div className="flex items-center gap-2">
              {requirements.uppercase ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-3 w-3 text-slate-400" />}
              <span className={requirements.uppercase ? 'text-green-700' : 'text-slate-500'}>One uppercase letter</span>
            </div>
            <div className="flex items-center gap-2">
              {requirements.number ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-3 w-3 text-slate-400" />}
              <span className={requirements.number ? 'text-green-700' : 'text-slate-500'}>One number</span>
            </div>
            <div className="flex items-center gap-2">
              {requirements.match ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-3 w-3 text-slate-400" />}
              <span className={requirements.match ? 'text-green-700' : 'text-slate-500'}>Passwords match</span>
            </div>
          </div>

          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 text-green-700 text-sm p-3">
              {success} ✓
            </div>
          )}
          {error && <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm p-3">{error}</div>}

          <button
            type="submit"
            disabled={!allMet || loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Password'
            )}
          </button>
        </form>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-slate-900 font-semibold">Login Activity</h3>
        <p className="text-slate-500 text-sm mt-2">
          Last login:{' '}
          {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Not available'}
        </p>
        <p className="text-slate-500 text-sm mt-1">Role: {user?.role || 'USER'}</p>
      </section>
    </div>
  );
};

export default ProfilePage;
