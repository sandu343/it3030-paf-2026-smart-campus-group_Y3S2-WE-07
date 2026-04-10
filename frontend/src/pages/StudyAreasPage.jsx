import { Link } from 'react-router-dom';
import { BookOpen, Monitor, Users } from 'lucide-react';

const studyAreas = [
  {
    name: 'Quiet Study Zone',
    location: 'Library - Floor 2',
    capacity: 40,
    features: 'Silent environment, charging ports',
    icon: BookOpen,
  },
  {
    name: 'Collaborative Hub',
    location: 'Engineering Block - Room E201',
    capacity: 24,
    features: 'Whiteboard, discussion tables',
    icon: Users,
  },
  {
    name: 'Computer Study Lab',
    location: 'Computing Center - Lab C3',
    capacity: 30,
    features: 'Desktop PCs, high-speed internet',
    icon: Monitor,
  },
];

const StudyAreasPage = () => {
  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-green-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-600">Campus Resources</p>
          <h1 className="mt-2 text-3xl font-extrabold text-green-900">Study Areas</h1>
          <p className="mt-2 text-sm text-slate-600">Browse available study spaces and choose where to reserve next.</p>

          <div className="mt-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center rounded-2xl border border-green-200 bg-white px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {studyAreas.map((area) => {
            const Icon = area.icon;
            return (
              <div key={area.name} className="rounded-3xl border border-green-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-green-900">{area.name}</h2>
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{area.location}</p>
                <p className="mt-1 text-sm text-slate-600">Capacity: {area.capacity}</p>
                <p className="mt-1 text-sm text-slate-600">{area.features}</p>

                <button
                  type="button"
                  className="mt-4 inline-flex rounded-2xl bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700"
                >
                  Reserve Area
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StudyAreasPage;