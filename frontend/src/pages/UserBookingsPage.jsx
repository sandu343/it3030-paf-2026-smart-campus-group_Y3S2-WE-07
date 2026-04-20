import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CalendarCheck2, ClipboardList, DoorOpen, PlusCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContextObject';
import BookingForm from '../components/BookingForm';
import BookingList from '../components/BookingList';
import PortalHeader from '../components/PortalHeader';
import bookingService from '../services/bookingService';

const tabs = [
  { key: 'create', label: 'Book a Resource', icon: PlusCircle },
  { key: 'bookings', label: 'My Bookings', icon: ClipboardList },
  { key: 'meeting-rooms', label: 'Meeting Rooms', icon: DoorOpen },
];

const UserBookingsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('create');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedMeetingRoomId, setSelectedMeetingRoomId] = useState('');
  const [meetingRooms, setMeetingRooms] = useState([]);
  const [meetingRoomsLoading, setMeetingRoomsLoading] = useState(false);
  const [meetingRoomsError, setMeetingRoomsError] = useState('');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLocationEnabled, setIsLocationEnabled] = useState(() => {
    return localStorage.getItem('studyAreaLocationPreference') === 'enabled';
  });

  const toggleLocation = () => {
    const nextValue = !isLocationEnabled;
    if (nextValue) {
      localStorage.setItem('studyAreaLocationPreference', 'enabled');
    } else {
      localStorage.removeItem('studyAreaLocationPreference');
    }
    setIsLocationEnabled(nextValue);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleBookingCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
    setActiveTab('bookings');
  };

  const handleCancel = () => {
    setActiveTab('bookings');
  };

  const handleBookMeetingRoom = (roomId) => {
    setSelectedMeetingRoomId(roomId);
    setActiveTab('create');
  };

  const isRoomBookable = (statusValue) => {
    const normalizedStatus = String(statusValue || '').toUpperCase();
    return !['UNAVAILABLE', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE'].includes(normalizedStatus);
  };

  const getRoomStatusStyles = (statusValue) => {
    const normalizedStatus = String(statusValue || '').toUpperCase();

    if (normalizedStatus === 'AVAILABLE') {
      return {
        card: 'border-blue-100 bg-gradient-to-br from-white to-blue-50/60',
        badge: 'bg-emerald-50 text-emerald-700',
      };
    }

    if (normalizedStatus === 'UNDER_MAINTENANCE') {
      return {
        card: 'border-blue-100 bg-gradient-to-br from-white to-blue-50/60',
        badge: 'bg-amber-50 text-amber-700',
      };
    }

    if (normalizedStatus === 'OUT_OF_SERVICE' || normalizedStatus === 'UNAVAILABLE') {
      return {
        card: 'border-blue-100 bg-gradient-to-br from-white to-blue-50/60',
        badge: 'bg-rose-50 text-rose-700',
      };
    }

    return {
      card: 'border-blue-100 bg-gradient-to-br from-white to-blue-50/60',
      badge: 'bg-blue-50 text-[#1E3A8A]',
    };
  };

  useEffect(() => {
    const loadMeetingRooms = async () => {
      try {
        setMeetingRoomsLoading(true);
        setMeetingRoomsError('');

        const data = await bookingService.fetchResources({ resourceType: 'MEETING_ROOM' });
        let safeRooms = Array.isArray(data) ? data : [];

        // Fallback: if backend filtering returns empty, fetch all and derive meeting rooms locally.
        if (safeRooms.length === 0) {
          const allResources = await bookingService.fetchResources();
          const safeAll = Array.isArray(allResources) ? allResources : [];
          safeRooms = safeAll.filter((resource) => {
            const typeValue = String(resource?.resourceType || resource?.type || '').toUpperCase();
            return typeValue.includes('MEETING');
          });
        }

        const sortedRooms = [...safeRooms].sort((left, right) => {
          const leftName = String(left.hallName || '').toLowerCase();
          const rightName = String(right.hallName || '').toLowerCase();
          return leftName.localeCompare(rightName);
        });

        setMeetingRooms(sortedRooms);
      } catch (error) {
        setMeetingRoomsError(error.response?.data?.message || error.message || 'Failed to load meeting rooms');
        setMeetingRooms([]);
      } finally {
        setMeetingRoomsLoading(false);
      }
    };

    if (activeTab === 'meeting-rooms') {
      loadMeetingRooms();
    }
  }, [activeTab]);

  const heroTitle = activeTab === 'create'
    ? 'Create and submit a new booking'
    : activeTab === 'bookings'
      ? 'Track every booking in one place'
      : 'Browse available meeting rooms';

  const heroDescription = activeTab === 'create'
    ? 'Choose a room, time slot, and purpose with the same clean Smart Campus workflow used across your dashboard.'
    : activeTab === 'bookings'
      ? 'Review approvals, pending requests, and cancellations with a clearer, student-friendly booking timeline.'
      : 'Check capacities, locations, and room status before jumping straight into a reservation.';

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_680px_at_10%_-10%,rgba(59,130,246,0.10)_0%,#F8FAFC_42%,#F5F7FA_100%)] text-slate-900">
      <PortalHeader
        user={user}
        onLogout={handleLogout}
        onBack={() => navigate('/dashboard')}
        showBackButton
        isLocationEnabled={isLocationEnabled}
        onToggleLocation={toggleLocation}
        isNotificationOpen={isNotificationOpen}
        setIsNotificationOpen={setIsNotificationOpen}
      />

      <main className="mx-auto max-w-[1320px] px-4 py-5 sm:px-6">
        <section className="rounded-[28px] border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fbff_65%,#f5f7fa_100%)] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] md:p-7">
          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
            <div>
              <p className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.15em] text-[#1E3A8A]">
                Smart Campus Booking Suite
              </p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
                {heroTitle}
              </h2>
              <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-600">
                {heroDescription}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-[24px] bg-[linear-gradient(135deg,#1E3A8A_0%,#3B82F6_100%)] p-6 text-white shadow-[0_24px_45px_rgba(30,58,138,0.28)]">
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-blue-100">Current View</p>
                <p className="mt-3 text-3xl font-black">{tabs.find((tab) => tab.key === activeTab)?.label}</p>
                <p className="mt-2 text-sm leading-6 text-blue-100">
                  Switch between creation, booking history, and meeting room discovery without leaving the page.
                </p>
              </div>

              <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#10B981]">Student Access</p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    <CalendarCheck2 className="h-5 w-5 text-[#1E3A8A]" />
                    <span className="text-sm font-semibold text-slate-700">Fast booking creation</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    <ClipboardList className="h-5 w-5 text-[#1E3A8A]" />
                    <span className="text-sm font-semibold text-slate-700">Clear approval tracking</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                    <Building2 className="h-5 w-5 text-[#1E3A8A]" />
                    <span className="text-sm font-semibold text-slate-700">Room details before booking</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="inline-flex flex-wrap gap-2 rounded-[24px] border border-slate-200 bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.05)]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-[18px] px-5 py-3 text-sm font-bold transition ${
                    isActive
                      ? 'bg-[#1E3A8A] text-white shadow-lg shadow-blue-200'
                      : 'bg-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] md:p-8">
          {activeTab === 'create' && (
            <div>
              <div className="mb-6">
                <h2 className="text-3xl font-black tracking-tight text-slate-900">Create a New Booking</h2>
                <p className="mt-2 text-base text-slate-600">
                  Fill in the details below to reserve a room or resource with the updated Smart Campus booking flow.
                </p>
              </div>
              <BookingForm
                onBookingCreated={handleBookingCreated}
                onCancel={handleCancel}
                preselectedResourceId={selectedMeetingRoomId}
              />
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="rounded-[24px] border border-blue-100 bg-[#F8FAFC] p-4 sm:p-5">
              <div className="mb-5">
                <h2 className="text-3xl font-black tracking-tight text-[#1E3A8A]">Your Bookings</h2>
                <p className="mt-2 text-base text-slate-600">
                  Review pending, approved, and cancelled resource reservations in one clean workspace.
                </p>
              </div>
              <BookingList refreshTrigger={refreshTrigger} />
            </div>
          )}

          {activeTab === 'meeting-rooms' && (
            <div className="rounded-[24px] border border-blue-100 bg-[#F8FAFC] p-4 sm:p-5">
              <div className="mb-6">
                <h2 className="text-3xl font-black tracking-tight text-[#1E3A8A]">Meeting Rooms Directory</h2>
                <p className="mt-2 text-base text-slate-600">
                  Compare capacity, location, and room status before booking the best space for your session.
                </p>
              </div>

              {meetingRoomsError && (
                <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                  {meetingRoomsError}
                </div>
              )}

              {meetingRoomsLoading ? (
                <div className="rounded-[24px] border border-blue-100 bg-white py-12 text-center text-sm text-slate-500">
                  Loading meeting rooms...
                </div>
              ) : meetingRooms.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {meetingRooms.map((room, index) => (
                    <article
                      key={room.id || room.hallNumber || `${room.hallName || 'room'}-${index}`}
                      className={`rounded-[24px] border bg-white p-5 shadow-[0_14px_30px_rgba(15,23,42,0.08)] ring-1 ring-blue-100/70 transition ${getRoomStatusStyles(room.status).card}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-bold text-slate-900">{room.hallName || 'Unnamed Room'}</p>
                          <p className="mt-1 text-sm text-slate-600">{room.buildingName || 'Unknown Building'}</p>
                        </div>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getRoomStatusStyles(room.status).badge}`}>
                          {String(room.status || 'UNKNOWN').replaceAll('_', ' ')}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-slate-700">
                        <p><span className="font-semibold text-slate-900">Capacity:</span> {room.capacity ?? 'N/A'}</p>
                        <p><span className="font-semibold text-slate-900">Block:</span> {room.blockName || 'N/A'}</p>
                        <p><span className="font-semibold text-slate-900">Floor:</span> {room.floorNumber ?? 'N/A'}</p>
                        <p><span className="font-semibold text-slate-900">Room No:</span> {room.hallNumber ?? 'N/A'}</p>
                        <p><span className="font-semibold text-slate-900">Projectors:</span> {room.projectorCount ?? 0}</p>
                        <p><span className="font-semibold text-slate-900">Cameras:</span> {room.cameraCount ?? 0}</p>
                        <p><span className="font-semibold text-slate-900">PCs:</span> {room.pcCount ?? 0}</p>
                      </div>

                      {room.description && (
                        <p className="mt-4 line-clamp-3 rounded-2xl border border-blue-100 bg-blue-50/60 px-3 py-3 text-sm text-slate-600">
                          {room.description}
                        </p>
                      )}

                      {isRoomBookable(room.status) && (
                        <button
                          type="button"
                          onClick={() => handleBookMeetingRoom(room.id)}
                          className="mt-4 w-full rounded-2xl bg-[#10B981] px-3 py-3 text-sm font-semibold text-white transition hover:bg-[#059669]"
                        >
                          Book This Meeting Room
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-[24px] border border-blue-100 bg-white px-5 py-10 text-center text-slate-600">
                  No meeting rooms found.
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default UserBookingsPage;
