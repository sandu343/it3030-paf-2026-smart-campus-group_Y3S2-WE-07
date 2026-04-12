import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
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
      <div className="mx-auto max-w-7xl">
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
      </div>
    </AdminLayout>
  );
};

export default AdminTicketsPage;
