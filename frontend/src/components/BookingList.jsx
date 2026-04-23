import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContextObject';
import bookingService from '../services/bookingService';

/**
 * BookingList Component
 * 
 * Displays user's bookings with comprehensive features.
 * 
 * Features:
 * - Fetch and display user bookings
 * - Filter by status (All, Pending, Approved, Rejected, Cancelled)
 * - Cancel pending bookings with confirmation
 * - Status badges with color coding
 * - Loading and empty states
 * - Responsive card and table layouts
 * - Real-time updates after actions
 */
const BookingList = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const loadBookings = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError('');
      const data = await bookingService.getUserBookings(user.id);
      setBookings(data || []);
    } catch (err) {
      setError('Failed to load bookings. Please try again later.');
      console.error('Error loading bookings:', err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const filterBookings = useCallback(() => {
    if (statusFilter === 'ALL') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(
        bookings.filter((booking) => booking.status === statusFilter)
      );
    }
  }, [bookings, statusFilter]);

  // Fetch user bookings on component mount or when refreshTrigger changes
  useEffect(() => {
    loadBookings();
  }, [loadBookings, refreshTrigger]);

  // Filter bookings based on selected status
  useEffect(() => {
    filterBookings();
  }, [filterBookings]);

  const handleCancelClick = (booking) => {
    setSelectedBooking(booking);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedBooking) return;

    try {
      setCancellingId(selectedBooking.id);
      await bookingService.cancelBooking(selectedBooking.id, cancelReason);
      
      setSuccess('✓ Booking cancelled successfully');
      setShowCancelModal(false);
      setSelectedBooking(null);
      setCancelReason('');
      
      // Remove cancelled booking from list
      setBookings((prev) =>
        prev.map((b) =>
          b.id === selectedBooking.id ? { ...b, status: 'CANCELLED' } : b
        )
      );

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to cancel booking. Try again.'
      );
      console.error('Error cancelling booking:', err);
    } finally {
      setCancellingId(null);
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'APPROVED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300';
      case 'REJECTED':
        return 'bg-rose-50 text-rose-800 border-rose-300';
      case 'CANCELLED':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return '⏳';
      case 'APPROVED':
        return '✓';
      case 'REJECTED':
        return '✗';
      case 'CANCELLED':
        return '🚫';
      default:
        return '•';
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

  // Check if booking can be cancelled (PENDING or APPROVED)
  const canCancel = (booking) => booking.status === 'PENDING' || booking.status === 'APPROVED';

  const getResourceName = (booking) =>
    booking.resource?.hallName || booking.resourceName || 'Unknown Resource';

  const getResourceType = (booking) =>
    booking.resource?.resourceType || booking.resourceType || '';

  const getBuildingName = (booking) =>
    booking.resource?.buildingName || booking.buildingName || '';

  return (
    <div className="rounded-[24px] border border-blue-100 bg-[#F8FAFC] p-4 sm:p-5">
      <div className="mx-auto max-w-6xl">

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
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 animate-in fade-in-0 duration-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-emerald-500"
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
                <p className="text-sm font-medium text-emerald-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Status Filter Tabs */}
        {bookings.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2 rounded-[24px] border border-blue-100 bg-white p-3">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'].map(
              (status) => {
                const count = bookings.filter(
                  (b) => status === 'ALL' || b.status === status
                ).length;
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                      statusFilter === status
                        ? 'bg-[#1E3A8A] text-white shadow-md'
                        : 'bg-[#F8FAFC] text-slate-700 hover:bg-blue-50 hover:text-[#1E3A8A]'
                    }`}
                  >
                    {status}
                    <span
                      className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-bold ${
                        statusFilter === status
                          ? 'bg-white/20 text-white'
                          : 'bg-blue-100 text-[#1E3A8A]'
                      }`}
                    >
                      {status === 'ALL'
                        ? bookings.length
                        : count}
                    </span>
                  </button>
                );
              }
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex h-64 items-center justify-center rounded-[24px] border border-blue-100 bg-white shadow-sm">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-[#1E3A8A]"></div>
              <p className="text-slate-600">Loading your bookings...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredBookings.length === 0 && (
          <div className="rounded-[24px] border border-blue-100 bg-white p-12 text-center shadow-sm">
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              {statusFilter === 'ALL'
                ? 'No bookings yet'
                : `No ${statusFilter.toLowerCase()} bookings`}
            </h3>
            <p className="mt-2 text-gray-600">
              {statusFilter === 'ALL'
                ? 'Create your first booking to get started'
                : `You don't have any ${statusFilter.toLowerCase()} bookings`}
            </p>
          </div>
        )}

        {/* Bookings List */}
        {!loading && filteredBookings.length > 0 && (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-[24px] border border-blue-100 bg-white shadow-sm transition-all duration-200 hover:border-[#3B82F6] hover:shadow-md"
              >
                <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                  {/* Booking Info */}
                  <div className="flex-1">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          {getResourceName(booking)}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {getResourceType(booking)}
                          {getBuildingName(booking) &&
                            ` • ${getBuildingName(booking)}`}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border-2 px-3 py-1 text-sm font-semibold ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        <span>{getStatusIcon(booking.status)}</span>
                        {booking.status}
                      </span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {/* Date */}
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-500">
                          Date
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {formatDate(booking.date)}
                        </p>
                      </div>

                      {/* Time */}
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-500">
                          Time
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {booking.startTime} - {booking.endTime}
                        </p>
                      </div>

                      {/* Purpose */}
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-500">
                          Purpose
                        </p>
                        <p className="mt-1 truncate font-semibold text-slate-900">
                          {booking.purpose}
                        </p>
                      </div>

                      {/* Attendees */}
                      <div>
                        <p className="text-xs font-semibold uppercase text-slate-500">
                          Attendees
                        </p>
                        <p className="mt-1 font-semibold text-slate-900">
                          {booking.attendees} people
                        </p>
                      </div>
                    </div>

                    {/* Additional Info */}
                    {booking.notes && (
                      <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-3">
                        <p className="text-xs font-semibold text-slate-600">
                          Notes:
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {booking.notes}
                        </p>
                      </div>
                    )}

                    {/* Status-specific Messages */}
                    {booking.status === 'REJECTED' && booking.rejectionReason && (
                      <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                        <p className="text-xs font-semibold text-red-700">
                          Rejection Reason:
                        </p>
                        <p className="mt-1 text-sm text-red-600">
                          {booking.rejectionReason}
                        </p>
                      </div>
                    )}

                    {booking.status === 'CANCELLED' && booking.cancellationReason && (
                      <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3">
                        <p className="text-xs font-semibold text-slate-600">
                          Cancellation Reason:
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          {booking.cancellationReason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 border-t border-blue-100 pt-4 sm:border-t-0 sm:border-l sm:border-blue-100 sm:pl-4 sm:pt-0">
                    {canCancel(booking) && (
                      <button
                        onClick={() => handleCancelClick(booking)}
                        disabled={cancellingId === booking.id}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#F59E0B] px-4 py-2 font-semibold text-white transition-all duration-200 hover:bg-[#D97706] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {cancellingId === booking.id ? (
                          <>
                            <svg className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Cancelling...
                          </>
                        ) : (
                          <>
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Cancel
                          </>
                        )}
                      </button>
                    )}

                    {!canCancel(booking) && (
                      <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-[#1E3A8A]">
                        {booking.status === 'APPROVED' && 'Approved'}
                        {booking.status === 'REJECTED' && 'Rejected'}
                        {booking.status === 'CANCELLED' && 'Cancelled'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelModal && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-[24px] border border-slate-200 bg-white shadow-xl">
              <div className="border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-bold text-slate-900">
                  Cancel Booking?
                </h2>
              </div>

              <div className="px-6 py-4">
                <p className="text-sm text-slate-700">
                  You are about to cancel your booking for{' '}
                  <strong>{getResourceName(selectedBooking)}</strong> on{' '}
                  <strong>{formatDate(selectedBooking.date)}</strong> at{' '}
                  <strong>
                    {selectedBooking.startTime} - {selectedBooking.endTime}
                  </strong>
                  .
                </p>

                <div className="mt-4">
                  <label
                    htmlFor="cancelReason"
                    className="block text-sm font-semibold text-slate-900"
                  >
                    Reason for Cancellation (Optional)
                  </label>
                  <textarea
                    id="cancelReason"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Let us know why you're cancelling..."
                    maxLength="200"
                    rows="3"
                    className="mt-2 block w-full rounded-2xl border-2 border-slate-200 px-4 py-3 text-sm focus:border-[#3B82F6] focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {cancelReason.length}/200 characters
                  </p>
                </div>
              </div>

              <div className="flex gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedBooking(null);
                    setCancelReason('');
                  }}
                  className="flex-1 rounded-2xl border-2 border-slate-300 px-4 py-2 font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50"
                >
                  Keep Booking
                </button>
                <button
                  onClick={handleConfirmCancel}
                  disabled={cancellingId === selectedBooking.id}
                  className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition-all duration-200 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {cancellingId === selectedBooking.id
                    ? 'Cancelling...'
                    : 'Confirm Cancellation'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingList;
