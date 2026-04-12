import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Building2,
  CalendarCheck2,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldUser,
  Ticket,
  Trash2,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  createCampusAlert,
  deleteCampusAlert,
  getAdminCampusAlerts,
  updateCampusAlert,
} from '../services/campusAlertService';

const sidebarItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
  { label: 'Resources', icon: Building2, to: '/admin/resources' },
  { label: 'Campus Alerts', icon: Bell, to: '/admin/alerts', active: true },
  { label: 'Manage Technicians', icon: Wrench, to: '/admin/technicians' },
  { label: 'Manage Bookings', icon: CalendarCheck2, to: '/admin/bookings' },
  { label: 'Manage Tickets', icon: Ticket, to: '/admin/tickets' },
  { label: 'Profile', icon: UserRound, to: '/profile' },
];

const emptyAlertForm = () => ({
  message: '',
  publishAt: '',
  endAt: '',
  active: true,
});

function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className="fixed right-4 top-4 z-[70] max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 h-2.5 w-2.5 rounded-full ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
          <p className="mt-1 text-sm text-slate-600">{toast.message}</p>
        </div>
        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ onLogout }) {
  return (
    <aside className="hidden xl:flex xl:w-72 xl:flex-col xl:border-r xl:border-green-100 xl:bg-white">
      <div className="flex items-center gap-3 border-b border-green-100 px-6 py-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-600 text-white">
          <ShieldUser className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-800">Smart Campus</p>
          <h1 className="text-lg font-extrabold text-slate-900">Operations Hub</h1>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4 py-6">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                item.active ? 'bg-green-600 text-white shadow-sm' : 'text-slate-600 hover:bg-green-50 hover:text-green-800'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-green-100 px-6 py-6">
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-4 py-2.5 text-sm font-semibold text-green-800 transition hover:bg-green-50"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}

function TopNavbar({ onLogout, user }) {
  return (
    <header className="sticky top-0 z-20 border-b border-green-100 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-green-100 text-green-800 xl:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-800">Smart Campus Admin</p>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Campus Alerts</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-green-100 text-green-800">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          <div className="hidden items-center gap-2 rounded-xl border border-green-100 bg-white px-3 py-2 sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-xs font-bold text-white">
              {user?.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <p className="text-sm font-semibold text-slate-700">{user?.name || 'Admin'}</p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

const Alert = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [alertSaving, setAlertSaving] = useState(false);
  const [editingAlertId, setEditingAlertId] = useState(null);
  const [alertForm, setAlertForm] = useState(emptyAlertForm());
  const [alertErrors, setAlertErrors] = useState({});
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const showToast = (type, title, message) => {
    setToast({ type, title, message });
  };

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const loadCampusAlerts = async () => {
    try {
      setLoadingAlerts(true);
      const data = await getAdminCampusAlerts();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError(fetchError.response?.data?.message || 'Failed to load campus alerts');
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    loadCampusAlerts();
  }, []);

  const validateAlertForm = () => {
    const nextErrors = {};
    const message = alertForm.message.trim();

    if (!message) {
      nextErrors.message = 'Message is required';
    } else if (message.length < 5 || message.length > 500) {
      nextErrors.message = 'Message must be between 5 and 500 characters';
    }

    if (!alertForm.publishAt) {
      nextErrors.publishAt = 'Publish time is required';
    }

    if (!alertForm.endAt) {
      nextErrors.endAt = 'End time is required';
    }

    const publishDate = alertForm.publishAt ? new Date(alertForm.publishAt) : null;
    const endDate = alertForm.endAt ? new Date(alertForm.endAt) : null;
    const now = new Date();

    if (!publishDate || Number.isNaN(publishDate.getTime())) {
      nextErrors.publishAt = 'Publish time is invalid';
    } else if (publishDate <= now) {
      nextErrors.publishAt = 'Publish time must be in the future';
    }

    if (!endDate || Number.isNaN(endDate.getTime())) {
      nextErrors.endAt = 'End time is invalid';
    } else if (endDate <= now) {
      nextErrors.endAt = 'End time must be in the future';
    }

    if (publishDate && endDate && endDate <= publishDate) {
      nextErrors.endAt = 'End time must be after publish time';
    }

    setAlertErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleAlertSubmit = async (event) => {
    event.preventDefault();
    if (!validateAlertForm()) {
      return;
    }

    try {
      setAlertSaving(true);
      const payload = {
        message: alertForm.message.trim(),
        publishAt: new Date(alertForm.publishAt).toISOString(),
        endAt: new Date(alertForm.endAt).toISOString(),
        active: alertForm.active,
      };

      if (editingAlertId) {
        await updateCampusAlert(editingAlertId, payload);
        showToast('success', 'Alert updated', 'Campus alert updated successfully.');
      } else {
        await createCampusAlert(payload);
        showToast('success', 'Alert created', 'Campus alert created successfully.');
      }

      setEditingAlertId(null);
      setAlertForm(emptyAlertForm());
      setAlertErrors({});
      await loadCampusAlerts();
    } catch (submitError) {
      const message = submitError.response?.data?.message || 'Failed to save campus alert';
      setError(message);
      showToast('error', 'Alert save failed', message);
    } finally {
      setAlertSaving(false);
    }
  };

  const startEditAlert = (alert) => {
    setEditingAlertId(alert.id);
    setAlertForm({
      message: alert.message || '',
      publishAt: alert.publishAt ? new Date(alert.publishAt).toISOString().slice(0, 16) : '',
      endAt: alert.endAt ? new Date(alert.endAt).toISOString().slice(0, 16) : '',
      active: Boolean(alert.active),
    });
    setAlertErrors({});
  };

  const cancelEditAlert = () => {
    setEditingAlertId(null);
    setAlertForm(emptyAlertForm());
    setAlertErrors({});
  };

  const handleDeleteAlert = async () => {
    if (!confirmDelete?.id) {
      return;
    }

    try {
      await deleteCampusAlert(confirmDelete.id);
      showToast('success', 'Alert deleted', 'Campus alert deleted successfully.');
      if (editingAlertId === confirmDelete.id) {
        cancelEditAlert();
      }
      await loadCampusAlerts();
    } catch (deleteError) {
      const message = deleteError.response?.data?.message || 'Unable to delete campus alert';
      showToast('error', 'Delete failed', message);
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 text-slate-900">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="flex min-h-screen">
        <Sidebar onLogout={() => { logout(); navigate('/staff/login', { replace: true }); }} />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopNavbar onLogout={() => { logout(); navigate('/staff/login', { replace: true }); }} user={user} />

          <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            <section className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">Campus Alerts</h1>
                <p className="mt-2 text-sm text-slate-600">Create, edit, and remove scheduled user alerts.</p>
              </div>
            </section>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <section className="space-y-6 rounded-2xl border border-green-100 bg-white p-4 shadow-sm sm:p-6">
              <form onSubmit={handleAlertSubmit} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="block lg:col-span-2">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Message</span>
                    <textarea
                      value={alertForm.message}
                      onChange={(event) => setAlertForm((prev) => ({ ...prev, message: event.target.value }))}
                      rows={4}
                      maxLength={500}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-500"
                      placeholder="Type campus message"
                    />
                    {alertErrors.message && <p className="mt-1 text-xs font-medium text-red-600">{alertErrors.message}</p>}
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Publish Time</span>
                    <input
                      type="datetime-local"
                      value={alertForm.publishAt}
                      onChange={(event) => setAlertForm((prev) => ({ ...prev, publishAt: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-500"
                    />
                    {alertErrors.publishAt && <p className="mt-1 text-xs font-medium text-red-600">{alertErrors.publishAt}</p>}
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">End Time</span>
                    <input
                      type="datetime-local"
                      value={alertForm.endAt}
                      onChange={(event) => setAlertForm((prev) => ({ ...prev, endAt: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-500"
                    />
                    {alertErrors.endAt && <p className="mt-1 text-xs font-medium text-red-600">{alertErrors.endAt}</p>}
                  </label>

                  <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={alertForm.active}
                      onChange={(event) => setAlertForm((prev) => ({ ...prev, active: event.target.checked }))}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                    Enabled
                  </label>
                </div>

                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  {editingAlertId && (
                    <button
                      type="button"
                      onClick={cancelEditAlert}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={alertSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {alertSaving ? 'Saving...' : editingAlertId ? 'Update Alert' : 'Create Alert'}
                  </button>
                </div>
              </form>

              {loadingAlerts ? (
                <div className="py-10 text-center text-slate-500">Loading campus alerts...</div>
              ) : alerts.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center text-slate-500">No alerts found.</div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-900">Message</th>
                        <th className="px-4 py-3 font-semibold text-slate-900">Publish</th>
                        <th className="px-4 py-3 font-semibold text-slate-900">End</th>
                        <th className="px-4 py-3 font-semibold text-slate-900">Status</th>
                        <th className="px-4 py-3 font-semibold text-slate-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {alerts.map((alert) => {
                        const now = Date.now();
                        const publishAt = new Date(alert.publishAt).getTime();
                        const endAt = new Date(alert.endAt).getTime();
                        const isLive = alert.active && now >= publishAt && now < endAt;
                        return (
                          <tr key={alert.id} className="align-top">
                            <td className="px-4 py-4 text-slate-700">{alert.message}</td>
                            <td className="px-4 py-4 text-slate-600">{new Date(alert.publishAt).toLocaleString()}</td>
                            <td className="px-4 py-4 text-slate-600">{new Date(alert.endAt).toLocaleString()}</td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${isLive ? 'bg-emerald-100 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
                                {isLive ? 'LIVE' : alert.active ? 'SCHEDULED/EXPIRED' : 'DISABLED'}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => startEditAlert(alert)}
                                  className="rounded-lg border border-green-200 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-50"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDelete({ id: alert.id })}
                                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete Campus Alert"
          message="Are you sure you want to delete this campus alert? This action cannot be undone."
          onConfirm={handleDeleteAlert}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

export default Alert;
