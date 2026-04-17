import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList, Clock3, LogOut, UserCircle, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContextObject';

const TechnicianDashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const displayName = user?.fullName || user?.name || user?.username || 'Technician';

  const handleLogout = () => {
    logout();
    navigate('/staff/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Service Console</p>
              <h1 className="text-2xl font-semibold text-slate-900">Welcome, {displayName}</h1>
              <p className="mt-1 text-sm text-slate-500">Monitor tickets and update maintenance progress.</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Assigned Tickets</p>
              <ClipboardList className="h-5 w-5 text-indigo-600" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-900">0</p>
            <p className="mt-1 text-xs text-slate-500">Waiting for assignment data</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">In Progress</p>
              <Wrench className="h-5 w-5 text-amber-500" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-900">0</p>
            <p className="mt-1 text-xs text-slate-500">Active maintenance work</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Avg Response Time</p>
              <Clock3 className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-slate-900">--</p>
            <p className="mt-1 text-xs text-slate-500">Available after ticket analytics</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                to="/technician/tickets"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                <ClipboardList className="h-4 w-4" />
                Open Tickets
              </Link>
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <UserCircle className="h-4 w-4" />
                My Profile
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Status</h2>
            <p className="mt-4 text-sm text-slate-600">
              Ticket module integration is in progress. Counts will automatically appear once backend ticket endpoints are connected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TechnicianDashboardPage;
