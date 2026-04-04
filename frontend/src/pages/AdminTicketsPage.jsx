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
          <h1 className="text-2xl font-extrabold text-slate-900">Manage Tickets</h1>
          <p className="mt-2 text-sm text-slate-600">Track incident requests, priorities, and resolutions from one view.</p>
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
