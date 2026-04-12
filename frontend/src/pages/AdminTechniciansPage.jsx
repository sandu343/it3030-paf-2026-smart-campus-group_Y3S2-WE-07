import TechnicianManager from '../components/admin/TechnicianManager';
import AdminLayout from '../components/admin/AdminLayout';

const AdminTechniciansPage = () => {
  return (
    <AdminLayout pageTitle="Manage Technicians" activePath="/admin/technicians">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-green-100 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-extrabold text-slate-900">Manage Technicians</h1>
          <p className="mt-2 text-sm text-slate-600">Create, edit, and maintain technician assignments</p>
        </section>

        <div className="rounded-2xl border border-green-100 bg-white p-2 shadow-sm">
          <TechnicianManager />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTechniciansPage;