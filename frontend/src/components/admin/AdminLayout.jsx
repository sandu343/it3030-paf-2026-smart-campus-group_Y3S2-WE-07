import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  CalendarCheck2,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldUser,
  Ticket,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContextObject';
import NotificationBell from '../NotificationBell';
import NotificationDropdown from '../NotificationDropdown';

const sidebarItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
  { label: 'Resources', icon: Building2, to: '/admin/resources' },
  { label: 'Manage Technicians', icon: Wrench, to: '/admin/technicians' },
  { label: 'Manage Bookings', icon: CalendarCheck2, to: '/admin/bookings' },
  { label: 'Manage Tickets', icon: Ticket, to: '/admin/tickets' },
];

const AdminLayout = ({ pageTitle, activePath, children }) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/staff/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#ffffff_0%,_#F8FAFC_45%,_#EEF2FF_100%)] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden xl:flex xl:w-72 xl:flex-col xl:border-r xl:border-blue-100 xl:bg-white">
          <div className="flex items-center gap-3 border-b border-blue-100 px-6 py-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 text-white">
              <ShieldUser className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-800">Smart Campus</p>
              <h1 className="text-lg font-extrabold text-slate-900">Operations Hub</h1>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-4 py-6">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.to === activePath;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-blue-700 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-blue-50 hover:text-blue-800'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-blue-100 px-6 py-6">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-semibold text-blue-800 transition hover:bg-blue-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-blue-100 bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 text-blue-800 xl:hidden">
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-800">Smart Campus Admin</p>
                  <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{pageTitle}</h2>
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

                <div className="hidden items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2 sm:flex">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{user?.name || 'Admin'}</p>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
