import { useEffect, useMemo, useState } from 'react';
import {
  AtSign,
  Check,
  Copy,
  Hash,
  Key,
  Loader2,
  Phone,
  PhoneCall,
  User,
  UserPlus,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import {
  checkUsernameAvailability,
  createTechnician,
  deactivateTechnician,
  getAllTechnicians,
  updateTechnician,
} from '../../services/adminService';

const departments = ['IT Support', 'Facilities', 'AV & Media', 'Electrical', 'Plumbing', 'Other'];

const makeSecurePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
  let pass = '';
  for (let i = 0; i < 12; i += 1) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  return pass;
};

const getBarColor = (count) => {
  if (count >= 7) return 'bg-red-500';
  if (count >= 4) return 'bg-amber-500';
  return 'bg-green-500';
};

const TechnicianManager = () => {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState({ username: '', password: '' });
  const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, message: '' });
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    department: 'IT Support',
    phoneNumber: '',
    staffId: '',
    initialPassword: '',
  });

  const loadTechnicians = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllTechnicians();
      setTechnicians(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load technicians');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTechnicians();
  }, []);

  useEffect(() => {
    if (!isModalOpen || form.username.trim().length < 4) {
      setUsernameStatus({ checking: false, available: null, message: '' });
      return undefined;
    }

    setUsernameStatus({ checking: true, available: null, message: '' });

    const timer = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailability(form.username.trim().toLowerCase());
        if (result?.available) {
          setUsernameStatus({ checking: false, available: true, message: 'Available' });
        } else {
          setUsernameStatus({
            checking: false,
            available: false,
            message: `Taken. Try ${form.username.trim().toLowerCase()}2`,
          });
        }
      } catch (err) {
        const existsLocally = technicians.some(
          (t) => (t.username || '').toLowerCase() === form.username.trim().toLowerCase()
        );
        if (existsLocally) {
          setUsernameStatus({
            checking: false,
            available: false,
            message: `Taken. Try ${form.username.trim().toLowerCase()}2`,
          });
        } else {
          setUsernameStatus({ checking: false, available: true, message: 'Available ✓' });
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [form.username, isModalOpen]);

  const stats = useMemo(() => {
    const total = technicians.length;
    const activeNow = technicians.filter((t) => (t.activeTicketsCount || 0) > 0).length;
    const available = technicians.filter((t) => (t.activeTicketsCount || 0) === 0).length;
    return { total, activeNow, available };
  }, [technicians]);

  const resetForm = () => {
    setForm({
      fullName: '',
      username: '',
      department: 'IT Support',
      phoneNumber: '',
      staffId: '',
      initialPassword: '',
    });
    setUsernameStatus({ checking: false, available: null, message: '' });
    setModalSuccess(false);
    setCreatedCredentials({ username: '', password: '' });
  };

  const openModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      const payload = {
        ...form,
        username: form.username.trim().toLowerCase(),
      };
      const created = await createTechnician(payload);
      setCreatedCredentials({
        username: created?.username || payload.username,
        password: payload.initialPassword,
      });
      setModalSuccess(true);
      await loadTechnicians();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create technician');
    } finally {
      setCreating(false);
    }
  };

  const onDeactivate = async (id) => {
    try {
      await deactivateTechnician(id);
      await loadTechnicians();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate technician');
    }
  };

  const onEdit = async (tech) => {
    const newDepartment = window.prompt('Update department', tech.department || '');
    const newPhone = window.prompt('Update phone number', tech.phoneNumber || '');

    if (newDepartment === null && newPhone === null) {
      return;
    }

    try {
      await updateTechnician(tech.id, {
        department: newDepartment ?? tech.department,
        phoneNumber: newPhone ?? tech.phoneNumber,
      });
      await loadTechnicians();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update technician');
    }
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  
  return (
    <div className="p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="font-semibold text-slate-900 text-xl">Technician Management</h2>
          <p className="text-slate-500 text-sm">Manage technician accounts and assignments</p>
        </div>
        <div className="flex items-center gap-2">
          
          <button
            type="button"
            onClick={openModal}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
          >
            <UserPlus className="h-4 w-4" />
            Add Technician
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="flex gap-4 mb-6">
        <div className="flex-1 rounded-xl border border-green-100 bg-green-50 p-4">
          <p className="text-sm text-slate-500">Total Technicians</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-2xl font-semibold text-slate-900">{stats.total}</p>
            <Users className="h-5 w-5 text-green-700" />
          </div>
        </div>
        <div className="flex-1 rounded-xl bg-green-50 p-4 border border-green-100">
          <p className="text-sm text-slate-500">Active Now</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-2xl font-semibold text-slate-900">{stats.activeNow}</p>
            <div className="h-3 w-3 rounded-full bg-green-500" />
          </div>
        </div>
        <div className="flex-1 rounded-xl bg-slate-50 p-4 border border-slate-200">
          <p className="text-sm text-slate-500">Available</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-2xl font-semibold text-slate-900">{stats.available}</p>
            <div className="h-3 w-3 rounded-full bg-slate-400" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex items-center justify-center text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading technicians...
        </div>
      ) : technicians.length === 0 ? (
        <div className="py-16 flex flex-col items-center text-center">
          <Wrench className="h-16 w-16 text-slate-300" />
          <p className="text-slate-500 font-medium mt-4">No technicians added yet</p>
          <p className="text-slate-400 text-sm mt-1">Add your first technician to start assigning tickets</p>
          <button
            type="button"
            onClick={openModal}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700"
          >
            <UserPlus className="h-4 w-4" />
            Add Technician
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {technicians.map((tech) => {
            const initials = (tech.fullName || 'NA')
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0]?.toUpperCase())
              .join('');
            const activeTickets = tech.activeTicketsCount || 0;
            const progress = Math.min((activeTickets / 10) * 100, 100);

            return (
              <div key={tech.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex justify-between">
                  <div className="flex gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 font-bold text-green-700">
                      {initials || 'NA'}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{tech.fullName}</p>
                      <p className="text-slate-500 text-sm">@{tech.username}</p>
                    </div>
                  </div>
                  <div className={`h-2.5 w-2.5 rounded-full ${activeTickets > 0 ? 'bg-green-500' : 'bg-slate-400'}`} />
                </div>

                <div className="space-y-2 mt-3">
                  <span className="inline-block rounded-full bg-slate-100 text-slate-600 text-xs px-2 py-1">
                    {tech.department || 'Unassigned'}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <PhoneCall className="h-4 w-4" />
                    <span>{tech.phoneNumber || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Hash className="h-4 w-4" />
                    <span>{tech.staffId || 'Auto-generated'}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-xs text-slate-500 mb-1">Active tickets: {activeTickets}</p>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full ${getBarColor(activeTickets)}`} style={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(tech)}
                    className="border border-slate-200 text-slate-600 text-sm px-3 py-1 rounded-lg"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeactivate(tech.id)}
                    className="border border-red-200 text-red-600 text-sm px-3 py-1 rounded-lg"
                  >
                    Deactivate
                  </button>
                  <button type="button" className="ml-auto text-sm text-green-700 hover:text-green-800">
                    View tickets
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div
        className={`fixed right-0 top-0 h-full w-96 bg-white border-l border-slate-200 shadow-2xl z-50 transition-transform duration-300 ${
          isModalOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Add New Technician</h3>
          <button type="button" onClick={closeModal} className="text-slate-500 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        {modalSuccess ? (
          <div className="p-6 flex flex-col gap-4">
            <div className="h-12 w-12 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
              <Check className="h-6 w-6" />
            </div>
            <p className="text-green-700 font-semibold">Technician account created!</p>
            <div className="rounded-lg bg-slate-900 text-slate-100 p-3 text-sm">
              <p>Username: {createdCredentials.username}</p>
              <p>Password: {createdCredentials.password}</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 border border-slate-300 rounded-lg px-3 py-2"
              onClick={() => copyText(`Username: ${createdCredentials.username}\nPassword: ${createdCredentials.password}`)}
            >
              <Copy className="h-4 w-4" />
              Copy credentials
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 border border-slate-300 rounded-lg py-2"
                onClick={resetForm}
              >
                Add another
              </button>
              <button
                type="button"
                className="flex-1 rounded-lg bg-green-600 py-2 text-white hover:bg-green-700"
                onClick={() => {
                  closeModal();
                  loadTechnicians();
                }}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={onCreate} className="h-[calc(100%-80px)] flex flex-col">
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <label className="block">
                <span className="text-sm text-slate-600 mb-1 block">Full Name</span>
                <div className="relative">
                  <User className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2"
                    placeholder="Kamal Perera"
                    value={form.fullName}
                    onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm text-slate-600 mb-1 block">Username</span>
                <div className="relative">
                  <AtSign className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2"
                    placeholder="tech.kamal"
                    value={form.username}
                    onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                    required
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">Staff will use this to log in</p>
                <div className="text-xs mt-1 min-h-5">
                  {usernameStatus.checking && (
                    <span className="text-slate-400 inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> Checking...
                    </span>
                  )}
                  {!usernameStatus.checking && usernameStatus.available === true && (
                    <span className="text-green-600">Available ✓</span>
                  )}
                  {!usernameStatus.checking && usernameStatus.available === false && (
                    <span className="text-red-600">{usernameStatus.message}</span>
                  )}
                </div>
              </label>

              <label className="block">
                <span className="text-sm text-slate-600 mb-1 block">Department</span>
                <select
                  className="w-full border border-slate-200 rounded-lg px-3 py-2"
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                >
                  {departments.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm text-slate-600 mb-1 block">Phone Number</span>
                <div className="relative">
                  <Phone className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2"
                    placeholder="+94 77 123 4567"
                    value={form.phoneNumber}
                    onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm text-slate-600 mb-1 block">Staff ID (optional)</span>
                <div className="relative">
                  <Hash className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2"
                    placeholder="Auto-generated if empty"
                    value={form.staffId}
                    onChange={(e) => setForm((f) => ({ ...f, staffId: e.target.value }))}
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm text-slate-600 mb-1 block">Initial Password</span>
                <div className="relative">
                  <Key className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    className="w-full border border-slate-200 rounded-lg pl-9 pr-20 py-2"
                    value={form.initialPassword}
                    onChange={(e) => setForm((f) => ({ ...f, initialPassword: e.target.value }))}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded bg-slate-100"
                    onClick={() => setForm((f) => ({ ...f, initialPassword: makeSecurePassword() }))}
                  >
                    Generate
                  </button>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-slate-400">Staff must change this on first login</p>
                  {form.initialPassword && (
                    <button
                      type="button"
                      className="text-slate-500 hover:text-slate-700"
                      onClick={() => copyText(form.initialPassword)}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </label>
            </div>

            <div className="p-6 border-t border-slate-200 flex items-center gap-2">
              <button type="button" className="flex-1 border border-slate-300 rounded-lg py-2" onClick={closeModal}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 py-2 text-white hover:bg-green-700 disabled:opacity-70"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Technician'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default TechnicianManager;
