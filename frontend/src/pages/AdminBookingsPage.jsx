import React, { useState } from 'react';
import AdminBookingPanel from '../components/AdminBookingPanel';
import AdminLayout from '../components/admin/AdminLayout';

const AdminBookingsPage = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <AdminLayout pageTitle="Manage Bookings" activePath="/admin/bookings">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-extrabold text-slate-900">Manage Bookings</h1>
          <p className="mt-2 text-sm text-slate-600">Review and approve pending resource bookings</p>
        </section>

        <div className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
          <AdminBookingPanel refreshTrigger={refreshTrigger} onRefresh={triggerRefresh} />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBookingsPage;
