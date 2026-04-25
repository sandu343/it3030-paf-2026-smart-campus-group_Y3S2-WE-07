import { useState } from 'react';
import { useAuth } from '../context/AuthContextObject';
import AdminLayout from '../components/admin/AdminLayout';
import TicketListPage from './Incident_tickting/pages/TicketListPage';
import TicketDetailsPage from './Incident_tickting/pages/TicketDetailsPage';

const AdminTicketsPage = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('list');
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleViewTicket = (ticketId) => {
    setSelectedTicketId(ticketId);
    setCurrentView('details');
  };

  const handleBack = () => {
    setCurrentView('list');
    setSelectedTicketId(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <AdminLayout pageTitle="Manage Tickets" activePath="/admin/tickets">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Manage Tickets</h1>
              <p className="mt-2 text-sm text-slate-600">
                Review, track, and resolve incident requests from one admin workspace.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="rounded-full bg-blue-100 px-3 py-1.5 text-blue-800">
                Admin: {user?.name || 'Smart Campus Admin'}
              </span>
              <span
                className={`rounded-full px-3 py-1.5 ${
                  currentView === 'list'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {currentView === 'list' ? 'Viewing Ticket List' : 'Viewing Ticket Details'}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-blue-100 bg-white p-3 shadow-sm sm:p-4">
          {currentView === 'list' && (
            <TicketListPage
              isAdmin
              isTechnician={false}
              currentUserId={user?.id}
              onCreateNew={() => {}}
              onViewTicket={handleViewTicket}
              refreshTrigger={refreshTrigger}
            />
          )}

          {currentView === 'details' && selectedTicketId && (
            <TicketDetailsPage
              ticketId={selectedTicketId}
              isAdmin
              isTechnician={false}
              currentUserId={user?.id}
              onBack={handleBack}
            />
          )}
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminTicketsPage;