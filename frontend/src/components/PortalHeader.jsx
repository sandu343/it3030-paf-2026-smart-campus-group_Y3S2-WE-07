import { Link } from 'react-router-dom';
import { ArrowLeft, Home, LogOut, MapPin, Search } from 'lucide-react';
import NotificationBell from './NotificationBell';
import NotificationDropdown from './NotificationDropdown';

const PortalHeader = ({
  user,
  onLogout,
  onBack,
  isLocationEnabled,
  onToggleLocation,
  isNotificationOpen,
  setIsNotificationOpen,
  showBackButton = false,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-green-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              onClick={onBack}
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-green-100 bg-white text-green-700 shadow-sm transition hover:bg-green-50"
              aria-label="Back"
              type="button"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}

          <Link to="/dashboard" className="flex items-center gap-3" aria-label="Go to dashboard">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600 text-white shadow-lg shadow-green-200">
              <Home className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-green-600">Smart Campus</p>
              <h1 className="text-3xl font-black leading-7 text-slate-900">Operations Hub</h1>
            </div>
          </Link>
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
          {typeof isLocationEnabled === 'boolean' && typeof onToggleLocation === 'function' && (
            <button
              onClick={onToggleLocation}
              className={`inline-flex items-center gap-2 rounded-[14px] border px-4 py-2 text-sm font-bold ${
                isLocationEnabled
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
              type="button"
            >
              <MapPin className="h-4 w-4" />
              {isLocationEnabled ? 'Location On' : 'Location Off'}
            </button>
          )}

          <label className="flex min-w-[260px] flex-1 items-center gap-2 rounded-[14px] border border-green-100 bg-white px-4 py-2">
            <Search className="h-4 w-4 text-green-600" />
            <input
              type="text"
              placeholder="Search bookings, tickets, resources..."
              className="w-full bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400"
            />
          </label>

          <div className="relative inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-green-100 bg-white text-slate-700 hover:bg-green-50">
            <NotificationBell onBellClick={() => setIsNotificationOpen((value) => !value)} />
            <NotificationDropdown isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
          </div>

          <div className="flex items-center gap-3 rounded-[14px] border border-green-100 bg-white px-3 py-2 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'N'}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{user?.name || 'Naveen'}</p>
              <p className="text-xs text-slate-500">{user?.email || 'IT23859411@my.sliit.lk'}</p>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-[14px] bg-green-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-green-200 transition hover:bg-green-700"
            type="button"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default PortalHeader;