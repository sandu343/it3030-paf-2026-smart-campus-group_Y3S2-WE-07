import { useState, useEffect, useRef } from 'react';
import { getNotifications, markAsRead, markAllAsRead } from '../services/notificationService';

const NotificationDropdown = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      const sortedNotifications = [...data].sort(
        (left, right) => new Date(right.createdAt) - new Date(left.createdAt)
      );

      setNotifications(sortedNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    } else {
      setLoading(true);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleNotificationsUpdated = () => {
      if (isOpen) {
        fetchNotifications();
      }
    };

    window.addEventListener('smartcampus-notifications-updated', handleNotificationsUpdated);

    return () => {
      window.removeEventListener('smartcampus-notifications-updated', handleNotificationsUpdated);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, status: 'READ', isRead: true }
            : notification
        )
      );
      window.dispatchEvent(new CustomEvent('smartcampus-notifications-updated'));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) => ({
          ...notification,
          status: 'READ',
          isRead: true,
        }))
      );
      window.dispatchEvent(new CustomEvent('smartcampus-notifications-updated'));
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const formatTimestamp = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
  };

  if (!isOpen) {
    return null;
  }

  const unreadCount = notifications.filter(
    (notification) => notification.status === 'UNREAD' || notification.isRead === false
  ).length;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-14 z-50 w-[22rem] overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-2xl shadow-emerald-100/40"
    >
      <div className="flex items-center justify-between border-b border-emerald-50 bg-gradient-to-r from-emerald-50 to-white px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
          {unreadCount > 0 && <p className="text-xs text-slate-500">{unreadCount} unread</p>}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="max-h-[26rem] overflow-y-auto">
        {loading ? (
          <div className="px-4 py-5 text-sm text-slate-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center text-slate-500">
            <svg className="mb-3 h-12 w-12 text-emerald-200" viewBox="0 0 24 24" width="48" height="48">
              <path
                fill="currentColor"
                d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"
              />
            </svg>
            <p className="text-sm font-medium text-slate-600">No notifications yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {notifications.map((notification) => {
              const isUnread = notification.status === 'UNREAD' || notification.isRead === false;

              return (
                <li
                  key={notification.id}
                  className={`flex items-start gap-3 px-4 py-4 transition ${isUnread ? 'bg-emerald-50/70' : 'bg-white'}`}
                >
                  <div className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${isUnread ? 'bg-emerald-600' : 'bg-slate-300'}`} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {notification.title || notification.type?.split('_').join(' ') || 'Notification'}
                        </p>
                        <p className="mt-1 text-sm leading-5 text-slate-600">{notification.message}</p>
                      </div>

                      <span className="whitespace-nowrap text-xs text-slate-400">
                        {formatTimestamp(notification.createdAt)}
                      </span>
                    </div>

                    {notification.relatedBookingId && (
                      <p className="mt-2 text-xs font-medium text-emerald-700">
                        Booking ID: {notification.relatedBookingId}
                      </p>
                    )}
                  </div>

                  {isUnread && (
                    <button
                      type="button"
                      className="rounded-full border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      onClick={() => handleMarkAsRead(notification.id)}
                      aria-label="Mark as read"
                    >
                      Read
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
