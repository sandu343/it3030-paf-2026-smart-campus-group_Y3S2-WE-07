import { useState, useEffect, useRef } from 'react';
import { getUnreadCount } from '../services/notificationService';

const NotificationBell = ({ onBellClick }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const bellRef = useRef(null);
  const previousUnreadCountRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);
  const flashTimeoutRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const nextUnreadCount = await getUnreadCount();

      if (hasLoadedOnceRef.current && nextUnreadCount > previousUnreadCountRef.current) {
        setHasNewNotification(true);

        if (flashTimeoutRef.current) {
          clearTimeout(flashTimeoutRef.current);
        }

        flashTimeoutRef.current = window.setTimeout(() => {
          setHasNewNotification(false);
        }, 3500);
      }

      previousUnreadCountRef.current = nextUnreadCount;
      hasLoadedOnceRef.current = true;
      setUnreadCount(nextUnreadCount);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 15000);

    const handleNotificationsUpdated = () => {
      fetchUnreadCount();
    };

    window.addEventListener('smartcampus-notifications-updated', handleNotificationsUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('smartcampus-notifications-updated', handleNotificationsUpdated);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    if (onBellClick) {
      onBellClick();
    }
  };

  if (loading) {
    return (
      <div ref={bellRef} className="relative flex h-10 w-10 items-center justify-center">
        <div className="h-4 w-4 animate-pulse rounded-full bg-emerald-200" />
      </div>
    );
  }

  return (
    <div ref={bellRef} className="relative flex h-10 w-10 items-center justify-center">
      <button
        type="button"
        className={`flex h-10 w-10 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700 shadow-sm transition hover:bg-emerald-50 ${hasNewNotification ? 'animate-pulse ring-2 ring-emerald-400 ring-offset-2 ring-offset-white' : ''}`}
        onClick={handleClick}
        aria-label="Notifications"
      >
        <svg
          className="h-5 w-5"
          style={{ color: unreadCount > 0 ? '#059669' : '#334155' }}
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"
          />
        </svg>
        {unreadCount > 0 && (
          <span className={`absolute -right-1 -top-1 min-w-5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold text-white ${hasNewNotification ? 'animate-pulse bg-emerald-500' : 'bg-emerald-600'}`}>
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default NotificationBell;
