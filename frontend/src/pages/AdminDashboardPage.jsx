import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpenCheck,
  CalendarCheck2,
  Building2,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldUser,
  Ticket,
  UserRound,
  UserRoundCog,
  Users,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAllTechnicians } from '../services/adminService';
import bookingService from '../services/bookingService';
import ticketApiService from './Incident_tickting/services/ticketApiService';
import NotificationBell from '../components/NotificationBell'
import NotificationDropdown from '../components/NotificationDropdown'

const sidebarItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard', active: true },
  { label: 'Resources', icon: Building2, to: '/admin/resources' },
  { label: 'Campus Alerts', icon: Bell, to: '/admin/alerts' },
  { label: 'Manage Technicians', icon: Wrench, to: '/admin/technicians' },
  { label: 'Manage Bookings', icon: CalendarCheck2, to: '/admin/bookings' },
  { label: 'Manage Tickets', icon: Ticket, to: '/admin/tickets' },

];

const getStatusLabel = (status) => {
  const normalized = String(status || '').toUpperCase();

  if (normalized === 'APPROVED' || normalized === 'RESOLVED') return 'Approved';
  if (normalized === 'REJECTED') return 'Rejected';
  if (normalized === 'CLOSED') return 'Closed';
  return 'Pending';
};

const formatDisplayDate = (dateValue) => {
  if (!dateValue) return 'Unknown date';

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return 'Unknown date';

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatRelativeTime = (dateValue) => {
  if (!dateValue) return 'Recently';

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return 'Recently';

  const diffMs = Date.now() - parsed.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  return formatDisplayDate(dateValue);
};

function StatusBadge({ status }) {
  const statusStyles = {
    Approved: 'bg-green-100 text-green-800 ring-green-200',
    Pending: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
    Rejected: 'bg-red-100 text-red-800 ring-red-200',
    Closed: 'bg-slate-100 text-slate-700 ring-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        statusStyles[status] || statusStyles.Pending
      }`}
    >
      {status}
    </span>
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
                item.active
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-green-50 hover:text-green-800'
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

function TopNavbar({ onLogout, user, isNotificationOpen, setIsNotificationOpen }) {
  return (
    <header className="sticky top-0 z-20 border-b border-green-100 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-green-100 text-green-800 xl:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-800">Smart Campus Admin</p>
            <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Dashboard</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <NotificationBell onBellClick={() => setIsNotificationOpen((value) => !value)} />
            <NotificationDropdown
              isOpen={isNotificationOpen}
              onClose={() => setIsNotificationOpen(false)}
            />
          </div>

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

function StatCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-700">
          {React.createElement(icon, { className: 'h-5 w-5' })}
        </div>
      </div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
      <div className="h-4 w-24 animate-pulse rounded bg-green-100" />
      <div className="mt-3 h-8 w-16 animate-pulse rounded bg-green-100" />
    </div>
  );
}

function ActionButton({ icon, label, to }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-gradient-to-br from-white to-green-50 px-4 py-3 text-sm font-semibold text-green-800 shadow-sm transition hover:-translate-y-0.5 hover:border-green-300 hover:shadow-md"
    >
      {React.createElement(icon, { className: 'h-4 w-4' })}
      {label}
    </Link>
  );
}

function BookingsTable({ bookings, loading }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-green-100 bg-white">
      <table className="min-w-full divide-y divide-green-100 text-left text-sm">
        <thead className="bg-green-50">
          <tr>
            <th className="px-4 py-3 font-semibold text-slate-900">Resource</th>
            <th className="px-4 py-3 font-semibold text-slate-900">Date</th>
            <th className="px-4 py-3 font-semibold text-slate-900">Requester</th>
            <th className="px-4 py-3 font-semibold text-slate-900">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-green-50 bg-white">
          {loading ? (
            <tr>
              <td className="px-4 py-6 text-center text-slate-500" colSpan="5">
                Loading bookings...
              </td>
            </tr>
          ) : bookings.length > 0 ? (
            bookings.map((booking) => (
              <tr key={booking.id}>
                <td className="px-4 py-3 text-slate-600">{booking.resource?.hallName || booking.resourceName || 'Unknown Resource'}</td>
                <td className="px-4 py-3 text-slate-600">{formatDisplayDate(booking.date || booking.createdAt)}</td>
                <td className="px-4 py-3 text-slate-600">{booking.user?.name || booking.userName || 'Unknown User'}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={getStatusLabel(booking.status)} />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-4 py-6 text-center text-slate-500" colSpan="5">
                No bookings found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function TicketsList({ tickets, loading }) {
  return (
    <div className="space-y-3">
      {loading ? (
        <div className="rounded-2xl border border-green-100 bg-white p-4 text-sm text-slate-500 shadow-sm">
          Loading tickets...
        </div>
      ) : tickets.length > 0 ? (
        tickets.map((ticket) => (
          <div key={ticket.id} className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{ticket.title || ticket.issue || 'Untitled ticket'}</p>
                <p className="mt-1 text-sm text-slate-600">{ticket.category || 'Uncategorized'}</p>
              </div>
              <StatusBadge status={getStatusLabel(ticket.status)} />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {formatRelativeTime(ticket.createdAt)}
            </p>
          </div>
        ))
      ) : (
        <div className="rounded-2xl border border-green-100 bg-white p-4 text-sm text-slate-500 shadow-sm">
          No tickets found
        </div>
      )}
    </div>
  );
}

function OverviewPanel() {
  const chartBars = [56, 72, 43, 88, 64, 79, 52];

  return (
    <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
      <h3 className="text-base font-bold text-slate-900">System Overview</h3>
      <p className="mt-1 text-sm text-slate-600">Bookings trend over the past 7 days</p>

      <div className="mt-5 flex h-36 items-end gap-2">
        {chartBars.map((height, index) => (
          <div key={index} className="flex-1 rounded-t-md bg-green-200">
            <div className="w-full rounded-t-md bg-green-600" style={{ height: `${height}%` }} />
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-green-50 p-3">
          <p className="text-slate-600">Resolution Rate</p>
          <p className="mt-1 text-lg font-extrabold text-slate-900">92%</p>
        </div>
        <div className="rounded-xl bg-green-50 p-3">
          <p className="text-slate-600">System Health</p>
          <p className="mt-1 text-lg font-extrabold text-slate-900">Optimal</p>
        </div>
      </div>
    </div>
  );
}

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalTechnicians: 0,
    pendingApprovals: 0,
    pendingTickets: 0,
    totalBookings: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);

  const handleLogout = () => {
    logout();
    navigate('/staff/login', { replace: true });
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        const [techniciansResult, bookingsResult, ticketsResult] = await Promise.allSettled([
          getAllTechnicians(),
          bookingService.getAllBookings(),
          ticketApiService.getAllTickets(),
        ]);

        const safeTechnicians = techniciansResult.status === 'fulfilled' && Array.isArray(techniciansResult.value)
          ? techniciansResult.value
          : [];
        const safeBookings = bookingsResult.status === 'fulfilled' && Array.isArray(bookingsResult.value)
          ? bookingsResult.value
          : [];
        const safeTickets = ticketsResult.status === 'fulfilled' && Array.isArray(ticketsResult.value)
          ? ticketsResult.value
          : [];

        const failures = [techniciansResult, bookingsResult, ticketsResult]
          .filter((result) => result.status === 'rejected')
          .map((result) => result.reason?.response?.data?.message || result.reason?.message || 'Request failed');

        const sortedBookings = [...safeBookings].sort((a, b) => {
          const aTime = new Date(a.createdAt || a.date || 0).getTime();
          const bTime = new Date(b.createdAt || b.date || 0).getTime();
          return bTime - aTime;
        });

        const sortedTickets = [...safeTickets].sort((a, b) => {
          const aTime = new Date(a.createdAt || 0).getTime();
          const bTime = new Date(b.createdAt || 0).getTime();
          return bTime - aTime;
        });

        setDashboardStats({
          totalTechnicians: safeTechnicians.length,
          pendingApprovals: safeBookings.filter((booking) => String(booking.status || '').toUpperCase() === 'PENDING').length,
          pendingTickets: safeTickets.filter((ticket) => {
            const status = String(ticket.status || '').toUpperCase();
            return status === 'OPEN' || status === 'PENDING';
          }).length,
          totalBookings: safeBookings.length,
        });

        setRecentBookings(sortedBookings.slice(0, 4));
        setRecentTickets(sortedTickets.slice(0, 4));

        if (failures.length > 0) {
          setError(failures.join(' | '));
        }
      } catch (fetchError) {
        setError(fetchError.response?.data?.message || fetchError.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const stats = [
    { label: 'Total Technicians', value: String(dashboardStats.totalTechnicians), icon: Users },
    { label: 'Pending Approvals', value: String(dashboardStats.pendingApprovals), icon: BookOpenCheck },
    { label: 'Pending Tickets', value: String(dashboardStats.pendingTickets), icon: Ticket },
    { label: 'Total Bookings', value: String(dashboardStats.totalBookings), icon: CalendarCheck2 },
  ];

  return (
    <div className="min-h-screen bg-green-50 text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar onLogout={handleLogout} />

        <div className="flex min-w-0 flex-1 flex-col">
          <TopNavbar
            onLogout={handleLogout}
            user={user}
            isNotificationOpen={isNotificationOpen}
            setIsNotificationOpen={setIsNotificationOpen}
          />

          <main className="flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
            <section className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
              <h1 className="text-2xl font-extrabold text-slate-900">Welcome back, Admin</h1>
              <p className="mt-2 text-sm text-slate-600">
                Here is your operational summary for Smart Campus facilities, bookings, and support services.
              </p>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {loading
                ? Array.from({ length: 4 }).map((_, index) => <LoadingCard key={index} />)
                : stats.map((item) => <StatCard key={item.label} {...item} />)}
            </section>

            {error && (
              <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                {error}
              </section>
            )}

            <section className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <ActionButton icon={UserRoundCog} label="Manage Technicians" to="/admin/technicians" />
                <ActionButton icon={Ticket} label="Manage Tickets" to="/admin/tickets" />
                <ActionButton icon={BookOpenCheck} label="Manage Bookings" to="/admin/bookings" />
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
              <div className="space-y-6">
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">Recent Bookings</h2>
                    <Link to="/admin/bookings" className="text-sm font-semibold text-green-700 hover:text-green-800">
                      View all
                    </Link>
                  </div>
                  <BookingsTable bookings={recentBookings} loading={loading} />
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">Recent Tickets</h2>
                    <Link to="/admin/tickets" className="text-sm font-semibold text-green-700 hover:text-green-800">
                      Open queue
                    </Link>
                  </div>
                  <TicketsList tickets={recentTickets} loading={loading} />
                </div>
              </div>

              <OverviewPanel />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
