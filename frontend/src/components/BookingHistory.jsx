import React, { useState, useEffect } from 'react';
import bookingService from '../services/bookingService';

/**
 * BookingHistory Component
 * 
 * Displays the timeline of status changes for a booking.
 * Shows when the booking was created, approved, rejected, or cancelled
 * with timestamps and any notes/reasons provided.
 * 
 * Props:
 * - bookingId: The booking ID to fetch history for
 * - compact: Boolean to show compact view (default: false)
 */
const BookingHistory = ({ bookingId, compact = false }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        setError('');
        // In a real app, this would call a backend endpoint
        // For now, we'll construct history from the booking details
        const booking = await bookingService.getBookingById?.(bookingId);
        if (booking) {
          const historyEvents = constructHistoryFromBooking(booking);
          setHistory(historyEvents);
        }
      } catch (err) {
        console.error('Error loading booking history:', err);
        setError('Failed to load booking history');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) {
      loadHistory();
    }
  }, [bookingId]);

  // Construct history events from booking object
  const constructHistoryFromBooking = (booking) => {
    const events = [];

    // Creation event
    if (booking.createdAt) {
      events.push({
        status: 'CREATED',
        timestamp: booking.createdAt,
        description: 'Booking created',
        icon: '📅',
        color: 'blue',
        detail: `Created for ${booking.date}`,
      });
    }

    // Approval event
    if (booking.status === 'APPROVED' && booking.approvedAt) {
      events.push({
        status: 'APPROVED',
        timestamp: booking.approvedAt,
        description: 'Booking approved',
        icon: '✅',
        color: 'green',
        detail: 'Your booking has been approved',
        note: booking.approvalNotes || booking.adminNotes,
        approvedBy: booking.approvedBy || 'Admin',
      });
    }

    // Rejection event
    if (booking.status === 'REJECTED' && booking.rejectedAt) {
      events.push({
        status: 'REJECTED',
        timestamp: booking.rejectedAt,
        description: 'Booking rejected',
        icon: '❌',
        color: 'red',
        detail: 'Your booking was not approved',
        note: booking.rejectionReason || booking.adminNotes,
        rejectedBy: booking.rejectedBy || 'Admin',
      });
    }

    // Cancellation event
    if (booking.status === 'CANCELLED' && booking.cancelledAt) {
      events.push({
        status: 'CANCELLED',
        timestamp: booking.cancelledAt,
        description: 'Booking cancelled',
        icon: '🚫',
        color: 'gray',
        detail: booking.cancellationReason || 'Booking was cancelled',
        cancelledBy: booking.cancelledBy || 'User',
      });
    }

    return events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  };

  const getStatusColor = (status) => {
    const colors = {
      CREATED: 'blue',
      APPROVED: 'green',
      REJECTED: 'red',
      PENDING: 'amber',
      CANCELLED: 'gray',
    };
    return colors[status] || 'gray';
  };

  const _getStatusIcon = (status) => {
    const icons = {
      CREATED: '📅',
      APPROVED: '✅',
      REJECTED: '❌',
      PENDING: '⏳',
      CANCELLED: '🚫',
    };
    return icons[status] || '•';
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
        <p className="text-sm text-gray-600">No status changes yet</p>
      </div>
    );
  }

  // Compact view - just show badges
  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {history.map((event, index) => (
          <div
            key={index}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-white ${
              event.color === 'blue'
                ? 'bg-blue-500'
                : event.color === 'green'
                ? 'bg-green-500'
                : event.color === 'red'
                ? 'bg-red-500'
                : event.color === 'amber'
                ? 'bg-amber-500'
                : 'bg-gray-500'
            }`}
            title={`${event.description} on ${formatDate(event.timestamp)}`}
          >
            <span>{event.icon}</span>
            <span>{event.status}</span>
          </div>
        ))}
      </div>
    );
  }

  // Full timeline view
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-6 text-lg font-bold text-gray-900">Booking Status Timeline</h3>
      <div className="space-y-6">
        {history.map((event, index) => {
          const colorClasses = {
            blue: {
              dot: 'bg-blue-500 ring-blue-200',
              line: 'bg-blue-200',
              card: 'border-blue-200 bg-blue-50',
              icon: 'text-blue-600',
            },
            green: {
              dot: 'bg-green-500 ring-green-200',
              line: 'bg-green-200',
              card: 'border-green-200 bg-green-50',
              icon: 'text-green-600',
            },
            red: {
              dot: 'bg-red-500 ring-red-200',
              line: 'bg-red-200',
              card: 'border-red-200 bg-red-50',
              icon: 'text-red-600',
            },
            amber: {
              dot: 'bg-amber-500 ring-amber-200',
              line: 'bg-amber-200',
              card: 'border-amber-200 bg-amber-50',
              icon: 'text-amber-600',
            },
            gray: {
              dot: 'bg-gray-500 ring-gray-200',
              line: 'bg-gray-200',
              card: 'border-gray-200 bg-gray-50',
              icon: 'text-gray-600',
            },
          };

          const color = event.color || getStatusColor(event.status);
          const classes = colorClasses[color];

          return (
            <div key={index} className="relative flex gap-6">
              {/* Timeline line */}
              {index < history.length - 1 && (
                <div className="absolute left-7 top-12 h-12 w-1" style={{ backgroundColor: classes.line.split(' ')[1] }}>
                </div>
              )}

              {/* Timeline dot */}
              <div className="flex flex-col items-center">
                <div
                  className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white ${classes.dot} shadow-md`}
                >
                  <span className="text-lg">{event.icon}</span>
                </div>
              </div>

              {/* Event content */}
              <div className="flex-1 pt-2">
                <div className={`rounded-lg border-2 p-4 ${classes.card}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className={`text-sm font-bold ${classes.icon}`}>
                        {event.description}
                      </h4>
                      <p className="mt-1 text-xs text-gray-600">
                        {formatDate(event.timestamp)}
                      </p>
                      {event.detail && (
                        <p className="mt-2 text-sm font-medium text-gray-800">
                          {event.detail}
                        </p>
                      )}
                      {event.note && (
                        <div className="mt-3 rounded border-l-4 border-current bg-white p-3">
                          <p className="text-xs font-semibold text-gray-700">
                            {event.status === 'REJECTED' ? 'Rejection Reason:' : 'Notes:'}
                          </p>
                          <p className="mt-1 text-xs text-gray-700 italic">{event.note}</p>
                        </div>
                      )}
                      {(event.approvedBy || event.rejectedBy || event.cancelledBy) && (
                        <p className="mt-2 text-xs text-gray-600">
                          <span className="font-semibold">
                            {event.approvedBy && `Approved by: ${event.approvedBy}`}
                            {event.rejectedBy && `Rejected by: ${event.rejectedBy}`}
                            {event.cancelledBy && `Cancelled by: ${event.cancelledBy}`}
                          </span>
                        </p>
                      )}
                    </div>
                    {/* Status badge */}
                    <span
                      className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold text-white ${
                        color === 'blue'
                          ? 'bg-blue-500'
                          : color === 'green'
                          ? 'bg-green-500'
                          : color === 'red'
                          ? 'bg-red-500'
                          : color === 'amber'
                          ? 'bg-amber-500'
                          : 'bg-gray-500'
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookingHistory;
