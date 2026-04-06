import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BookingForm from '../components/BookingForm';
import BookingList from '../components/BookingList';
import PortalHeader from '../components/PortalHeader';
import bookingService from '../services/bookingService';

/**
 * UserBookingsPage
 * 
 * Comprehensive page for users to manage their resource bookings.
 * 
 * Features:
 * - Create new bookings using BookingForm
 * - View and manage user bookings with BookingList
 * - Automatic list refresh when bookings are created/cancelled
 * - Tab-based view switching between Create and My Bookings
 * - Responsive design matching dashboard theme
 */
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
    // Trigger list refresh
    setRefreshTrigger((prev) => prev + 1);
    // Show success and switch to bookings view
    setActiveTab('bookings');
  };

  const handleCancel = () => {
    // User cancelled form, go back to bookings view
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
        card: 'border-green-100 bg-gradient-to-br from-white to-green-50/40',
        badge: 'bg-green-100 text-green-700',
      };
    }

    if (normalizedStatus === 'UNDER_MAINTENANCE') {
      return {
        card: 'border-amber-200 bg-gradient-to-br from-white to-amber-50/50',
        badge: 'bg-amber-100 text-amber-700',
      };
    }

    if (normalizedStatus === 'OUT_OF_SERVICE' || normalizedStatus === 'UNAVAILABLE') {
      return {
        card: 'border-red-200 bg-gradient-to-br from-white to-red-50/50',
        badge: 'bg-red-100 text-red-700',
      };
    }

    return {
      card: 'border-slate-200 bg-gradient-to-br from-white to-slate-50/40',
      badge: 'bg-slate-100 text-slate-600',
    };
  };

  useEffect(() => {
    const loadMeetingRooms = async () => {
      try {
        setMeetingRoomsLoading(true);
        setMeetingRoomsError('');

        const data = await bookingService.fetchResources({ resourceType: 'MEETING_ROOM' });
        const safeRooms = Array.isArray(data) ? data : [];

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

  return (
    <div className="min-h-screen bg-[radial-gradient(1000px_600px_at_10%_-10%,#dcfce7_0%,#f8fafc_42%,#f0fdf4_100%)] text-slate-900">
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

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Tab Navigation */}
        <div className="mb-8 flex gap-2 border-b border-green-100">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 text-sm font-semibold transition border-b-2 ${
              activeTab === 'create'
                ? 'border-green-600 text-green-700 bg-green-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Book a Resource
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-6 py-3 text-sm font-semibold transition border-b-2 ${
              activeTab === 'bookings'
                ? 'border-green-600 text-green-700 bg-green-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            My Bookings
          </button>
          <button
            onClick={() => setActiveTab('meeting-rooms')}
            className={`px-6 py-3 text-sm font-semibold transition border-b-2 ${
              activeTab === 'meeting-rooms'
                ? 'border-green-600 text-green-700 bg-green-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Meeting Rooms
          </button>
        </div>

        {/* Tab Content */}
        <div className="rounded-3xl border border-green-100 bg-white shadow-sm">
          {/* Create Booking Tab */}
          {activeTab === 'create' && (
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-green-900">Create a New Booking</h2>
                <p className="mt-1 text-slate-600">Fill in the details below to book a resource for your needs.</p>
              </div>
              <BookingForm 
                onBookingCreated={handleBookingCreated}
                onCancel={handleCancel}
                preselectedResourceId={selectedMeetingRoomId}
              />
            </div>
          )}

          {/* My Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-green-900">Your Bookings</h2>
                <p className="mt-1 text-slate-600">View and manage all your resource bookings below.</p>
              </div>
              <BookingList refreshTrigger={refreshTrigger} />
            </div>
          )}

          {/* Meeting Rooms Tab */}
          {activeTab === 'meeting-rooms' && (
            <div className="p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-green-900">All Meeting Rooms</h2>
                <p className="mt-1 text-slate-600">Browse all meeting room details and capacities before creating a booking.</p>
              </div>

              {meetingRoomsError && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {meetingRoomsError}
                </div>
              )}

              {meetingRoomsLoading ? (
                <div className="py-10 text-center text-sm text-slate-500">Loading meeting rooms...</div>
              ) : meetingRooms.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {meetingRooms.map((room) => (
                    <article
                      key={room.id}
                      className={`rounded-2xl border p-5 shadow-sm ${getRoomStatusStyles(room.status).card}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-bold text-slate-900">{room.hallName || 'Unnamed Room'}</p>
                          <p className="mt-1 text-sm text-slate-600">{room.buildingName || 'Unknown Building'}</p>
                        </div>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getRoomStatusStyles(room.status).badge}`}
                        >
                          {String(room.status || 'UNKNOWN').replaceAll('_', ' ')}
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-sm text-slate-700">
                        <p><span className="font-semibold">Capacity:</span> {room.capacity ?? 'N/A'}</p>
                        <p><span className="font-semibold">Block:</span> {room.blockName || 'N/A'}</p>
                        <p><span className="font-semibold">Floor:</span> {room.floorNumber ?? 'N/A'}</p>
                        <p><span className="font-semibold">Room No:</span> {room.hallNumber ?? 'N/A'}</p>
                        <p><span className="font-semibold">Projectors:</span> {room.projectorCount ?? 0}</p>
                        <p><span className="font-semibold">Cameras:</span> {room.cameraCount ?? 0}</p>
                        <p><span className="font-semibold">PCs:</span> {room.pcCount ?? 0}</p>
                      </div>

                      {room.description && (
                        <p className="mt-4 line-clamp-3 rounded-xl bg-green-50 px-3 py-2 text-sm text-slate-600">
                          {room.description}
                        </p>
                      )}

                      {isRoomBookable(room.status) && (
                        <button
                          type="button"
                          onClick={() => handleBookMeetingRoom(room.id)}
                          className="mt-4 w-full rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-700"
                        >
                          Book This Meeting Room
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-green-100 bg-green-50/50 px-5 py-8 text-center text-slate-600">
                  No meeting rooms found.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserBookingsPage;
