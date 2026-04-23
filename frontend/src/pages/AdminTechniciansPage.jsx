import TechnicianManager from '../components/admin/TechnicianManager';
import AdminLayout from '../components/admin/AdminLayout';

const AdminTechniciansPage = () => {
  return (
    <AdminLayout pageTitle="Manage Technicians" activePath="/admin/technicians">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-6 shadow-sm">
          <h1 className="text-2xl font-extrabold text-slate-900">Manage Technicians</h1>
          <p className="mt-2 text-sm text-slate-600">Create, edit, and maintain technician assignments in one workspace.</p>
        </section>

        <div className="rounded-2xl border border-blue-100 bg-white p-2 shadow-sm">
          <TechnicianManager />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTechniciansPage;
