import React, { useState, useEffect } from 'react';
import bookingService from '../services/bookingService';

/**
 * AdminBookingPanel Component
 * 
 * Admin dashboard for managing all bookings.
 * 
 * Features:
 * - Display all bookings list
 * - Approve/Reject bookings
 * - Reason input for rejections
 * - Status updates with loading states
 * - Real-time notifications
 * - Booking details display
 * - Search and filter functionality
 */
const AdminBookingPanel = ({ refreshTrigger }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actioningId, setActioningId] = useState(null);
  const [actioningStatus, setActioningStatus] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [reason, setReason] = useState('');
  const [currentAction, setCurrentAction] = useState(null); // 'APPROVE' or 'REJECT'

  // Load all bookings on mount
  useEffect(() => {
    loadAllBookings();
  }, [refreshTrigger]);

  const loadAllBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await bookingService.getAllBookings();
      setBookings(data || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to load bookings. Please check your admin access and try again.'
      );
      console.error('Error loading bookings:', err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const getBookingResourceId = (booking) =>
    booking.resource?.id || booking.resourceId || '';

  const getBookingResourceName = (booking) =>
    booking.resource?.hallName || booking.resourceName || 'Unknown Resource';

  const getBookingResourceType = (booking) =>
    booking.resource?.resourceType || booking.resourceType || '';

  const getBookingBuildingName = (booking) =>
    booking.resource?.buildingName || booking.buildingName || '';

  const getBookingUserName = (booking) =>
    booking.user?.name || booking.userName || 'Unknown User';

  const getBookingUserEmail = (booking) =>
    booking.user?.email || booking.userEmail || '';

  // Filter bookings by search term, date, resource, and status
  const getUniqueResources = () => {
    const resources = new Map();
    bookings.forEach((booking) => {
      const resourceId = getBookingResourceId(booking);
      const resourceName = getBookingResourceName(booking);
      if (resourceId && !resources.has(resourceId)) {
        resources.set(resourceId, { id: resourceId, hallName: resourceName });
      }
    });
    return Array.from(resources.values()).sort((a, b) =>
      a.hallName.localeCompare(b.hallName)
    );
  };

  const filteredBookings = bookings.filter((booking) => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      getBookingResourceName(booking).toLowerCase().includes(searchLower) ||
      getBookingUserName(booking).toLowerCase().includes(searchLower) ||
      getBookingUserEmail(booking).toLowerCase().includes(searchLower) ||
      booking.purpose?.toLowerCase().includes(searchLower);

    // Date filter
    const matchesDate = !dateFilter || booking.date === dateFilter;

    // Resource filter
    const matchesResource =
      !resourceFilter || getBookingResourceId(booking) === resourceFilter;

    // Status filter
    const matchesStatus = statusFilter === 'ALL' || booking.status === statusFilter;

    return matchesSearch && matchesDate && matchesResource && matchesStatus;
  });

  const openActionModal = (booking, action) => {
    setSelectedBooking(booking);
    setCurrentAction(action);
    setReason('');
    setShowModal(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedBooking || !currentAction) return;

    try {
      setActioningId(selectedBooking.id);
      setActioningStatus(currentAction);

      await bookingService.updateBookingStatus(
        selectedBooking.id,
        currentAction,
        reason
      );

      setSuccess(`✓ Booking ${currentAction.toLowerCase()}d successfully`);
      setShowModal(false);
      setSelectedBooking(null);
      setReason('');
      setCurrentAction(null);
      await loadAllBookings();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Failed to ${currentAction.toLowerCase()} booking. Try again.`
      );
      console.error('Error updating booking status:', err);
    } finally {
      setActioningId(null);
      setActioningStatus(null);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format time
  const formatTime = (timeString) => {
    return timeString;
  };

  // Calculate booking duration
  const calculateDuration = (startTime, endTime) => {
    const [startHour, startMin] = startTime.split(':');
    const [endHour, endMin] = endTime.split(':');
    const startTotalMin = parseInt(startHour) * 60 + parseInt(startMin);
    const endTotalMin = parseInt(endHour) * 60 + parseInt(endMin);
    const durationMin = endTotalMin - startTotalMin;
    const hours = Math.floor(durationMin / 60);
    const mins = durationMin % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="w-full rounded-2xl border border-green-100 bg-green-50/60 p-3 sm:p-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Booking Management</h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">
            Review and manage pending booking requests
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 animate-in fade-in-0 duration-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 animate-in fade-in-0 duration-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Stats */}
        <div className="mb-4 rounded-xl border border-green-100 bg-white p-3 shadow-sm sm:p-4">
          {/* Search Bar */}
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by resource, user, purpose..."
                className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-10 text-sm focus:border-green-500 focus:outline-none"
              />
              <svg
                className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            <div className="inline-flex items-center gap-2 self-start rounded-lg bg-green-100 px-4 py-2 text-sm font-semibold text-green-800 sm:self-auto">
              <span className="inline-block h-3 w-3 rounded-full bg-green-500"></span>
              {filteredBookings.length} of {bookings.length}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 font-semibold transition-all duration-200 ${
                showFilters
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <svg
                className={`h-5 w-5 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              Filters
            </button>
          </div>

          {/* Filter Controls */}
          {showFilters && (
            <div className="border-t border-green-100 pt-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Date Filter */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600">
                    Filter by Date
                  </label>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-green-500 focus:outline-none"
                  />
                  {dateFilter && (
                    <button
                      onClick={() => setDateFilter('')}
                      className="mt-2 text-xs font-semibold text-green-700 hover:text-green-800"
                    >
                      Clear date filter
                    </button>
                  )}
                </div>

                {/* Resource Filter */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600">
                    Filter by Resource
                  </label>
                  <select
                    value={resourceFilter}
                    onChange={(e) => setResourceFilter(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-green-500 focus:outline-none"
                  >
                    <option value="">All Resources</option>
                    {getUniqueResources().map((resource) => (
                      <option key={resource.id} value={resource.id}>
                        {resource.hallName}
                      </option>
                    ))}
                  </select>
                  {resourceFilter && (
                    <button
                      onClick={() => setResourceFilter('')}
                      className="mt-2 text-xs font-semibold text-green-700 hover:text-green-800"
                    >
                      Clear resource filter
                    </button>
                  )}
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-600">
                    Filter by Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-green-500 focus:outline-none"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  {statusFilter !== 'ALL' && (
                    <button
                      onClick={() => setStatusFilter('ALL')}
                      className="mt-2 text-xs font-semibold text-green-700 hover:text-green-800"
                    >
                      Clear status filter
                    </button>
                  )}
                </div>
              </div>

              {/* Active Filters Display */}
              {(dateFilter || resourceFilter || statusFilter !== 'ALL') && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {dateFilter && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                      📅 {dateFilter}
                      <button
                        onClick={() => setDateFilter('')}
                        className="text-green-700 hover:text-green-900"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {resourceFilter && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                      🏛️ {getUniqueResources().find((r) => r.id === resourceFilter)?.hallName}
                      <button
                        onClick={() => setResourceFilter('')}
                        className="text-green-700 hover:text-green-900"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  {statusFilter !== 'ALL' && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                      {statusFilter === 'PENDING' && '⏳'}
                      {statusFilter === 'APPROVED' && '✓'}
                      {statusFilter === 'REJECTED' && '✗'}
                      {statusFilter === 'CANCELLED' && '⊘'}
                      {statusFilter}
                      <button
                        onClick={() => setStatusFilter('ALL')}
                        className="text-green-700 hover:text-green-900"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setDateFilter('');
                      setResourceFilter('');
                      setStatusFilter('ALL');
                      setSearchTerm('');
                    }}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex h-64 items-center justify-center rounded-lg bg-white shadow">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
              <p className="text-gray-600">Loading bookings...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && bookings.length === 0 && (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              All Caught Up!
            </h3>
            <p className="mt-2 text-gray-600">
              There are no bookings available right now.
            </p>
          </div>
        )}

        {/* No Results */}
        {!loading && bookings.length > 0 && filteredBookings.length === 0 && (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              No Results Found
            </h3>
            <p className="mt-2 text-gray-600">
              No bookings match your current search and filter criteria.
            </p>
            {(searchTerm || dateFilter || resourceFilter || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setDateFilter('');
                  setResourceFilter('');
                  setStatusFilter('ALL');
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-all duration-200 hover:bg-green-700"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* Bookings Table */}
        {!loading && filteredBookings.length > 0 && (
          <div className="space-y-2.5">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="overflow-hidden rounded-xl border border-green-100 bg-white shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <div className="flex flex-col gap-2.5 p-3 sm:gap-3">
                  {/* Top Section */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Resource & User Info */}
                    <div className="flex-1">
                      <div className="mb-1.5">
                        <h3 className="text-base font-bold text-gray-900 sm:text-[17px]">
                          {getBookingResourceName(booking)}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {getBookingResourceType(booking)}
                          {getBookingBuildingName(booking) &&
                            ` • ${getBookingBuildingName(booking)}`}
                        </p>
                      </div>

                      <div className="rounded-lg bg-green-50 p-2">
                        <p className="text-xs font-semibold uppercase text-gray-600">
                          Requested By
                        </p>
                        <p className="mt-1 font-semibold text-gray-900">
                          {getBookingUserName(booking)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {getBookingUserEmail(booking)}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 self-start rounded-full border px-2.5 py-1 text-xs font-semibold ${
                        booking.status === 'PENDING'
                          ? 'border-amber-300 bg-amber-100 text-amber-800'
                          : booking.status === 'APPROVED'
                            ? 'border-green-300 bg-green-100 text-green-800'
                            : booking.status === 'REJECTED'
                              ? 'border-red-300 bg-red-100 text-red-800'
                              : 'border-gray-300 bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span>
                        {booking.status === 'PENDING' && '⏳'}
                        {booking.status === 'APPROVED' && '✓'}
                        {booking.status === 'REJECTED' && '✗'}
                        {booking.status === 'CANCELLED' && '⊘'}
                      </span>
                      {booking.status || 'UNKNOWN'}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid gap-2.5 border-t border-green-100 pt-2.5 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Date */}
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">
                        Date
                      </p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {formatDate(booking.date)}
                      </p>
                    </div>

                    {/* Time */}
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">
                        Time
                      </p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                      </p>
                    </div>

                    {/* Duration */}
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">
                        Duration
                      </p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {calculateDuration(booking.startTime, booking.endTime)}
                      </p>
                    </div>

                    {/* Attendees */}
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">
                        Attendees
                      </p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {booking.attendees} / {booking.resource?.capacity || '?'}
                      </p>
                    </div>
                  </div>

                  {/* Purpose & Notes */}
                  <div className="border-t border-green-100 pt-2.5">
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-600">
                        Purpose
                      </p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        {booking.purpose}
                      </p>
                    </div>

                    {booking.notes && (
                      <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-2">
                        <p className="text-xs font-semibold text-green-700">
                          Additional Notes:
                        </p>
                        <p className="mt-1 text-sm text-green-900">
                          {booking.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {booking.status === 'PENDING' && (
                    <div className="flex flex-col gap-2 border-t border-green-100 pt-2.5 sm:flex-row">
                      <button
                        onClick={() => openActionModal(booking, 'APPROVED')}
                        disabled={actioningId === booking.id}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white transition-all duration-200 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actioningId === booking.id && actioningStatus === 'APPROVED' ? (
                          <>
                            <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Approving...
                          </>
                        ) : (
                          <>
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Approve
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => openActionModal(booking, 'REJECTED')}
                        disabled={actioningId === booking.id}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 font-semibold text-white transition-all duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actioningId === booking.id && actioningStatus === 'REJECTED' ? (
                          <>
                            <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Rejecting...
                          </>
                        ) : (
                          <>
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                            Reject
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Modal */}
        {showModal && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
              {/* Header */}
              <div
                className={`border-b px-6 py-4 ${
                  currentAction === 'APPROVED'
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <h2
                  className={`text-lg font-bold ${
                    currentAction === 'APPROVED'
                      ? 'text-green-900'
                      : 'text-red-900'
                  }`}
                >
                  {currentAction === 'APPROVED'
                    ? '✓ Approve Booking'
                    : '✗ Reject Booking'}
                </h2>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                <p className="mb-3 text-sm text-gray-700">
                  Booking Details:
                </p>
                <div className="mb-4 rounded-lg bg-gray-50 p-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {getBookingResourceName(selectedBooking)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {formatDate(selectedBooking.date)} at{' '}
                    {formatTime(selectedBooking.startTime)} -{' '}
                    {formatTime(selectedBooking.endTime)}
                  </p>
                  <p className="mt-1 text-xs text-gray-600">
                    Requested by: {getBookingUserName(selectedBooking)} (
                    {getBookingUserEmail(selectedBooking)})
                  </p>
                </div>

                {/* Reason Input */}
                <div>
                  <label
                    htmlFor="reason"
                    className="block text-sm font-semibold text-gray-900"
                  >
                    {currentAction === 'APPROVED'
                      ? 'Approval Notes (Optional)'
                      : 'Rejection Reason (Optional)'}
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    {currentAction === 'APPROVED'
                      ? 'Add any notes or conditions for this approval'
                      : 'Please provide a reason for rejection'}
                  </p>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={
                      currentAction === 'APPROVED'
                        ? 'E.g., Approved with projector setup provided'
                        : 'E.g., Resource is already booked at this time'
                    }
                    maxLength="500"
                    rows="4"
                    className="mt-2 block w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {reason.length}/500 characters
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-3 border-t border-gray-200 px-6 py-4">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedBooking(null);
                    setReason('');
                    setCurrentAction(null);
                  }}
                  className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-2 font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  disabled={actioningId === selectedBooking.id}
                  className={`flex-1 rounded-lg px-4 py-2 font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                    currentAction === 'APPROVED'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {actioningId === selectedBooking.id
                    ? `${currentAction === 'APPROVED' ? 'Approving' : 'Rejecting'}...`
                    : `Confirm ${currentAction}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookingPanel;
