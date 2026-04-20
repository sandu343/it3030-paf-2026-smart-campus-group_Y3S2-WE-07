import axios from 'axios';
import { getToken, logout } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

const getAuthHeaders = () => {
  const token = getToken();

  if (!token) {
    throw new Error('No authentication token');
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const getNotifications = async () => {
  try {
    const response = await axios.get(`${API_URL}/notifications`, {
      headers: getAuthHeaders(),
    });

    return response.data || [];
  } catch (error) {
    if (error.response?.status === 401) {
      logout();
      return [];
    }

    throw new Error(error.response?.data?.message || error.message || 'Failed to load notifications');
  }
};

export const markAsRead = async (notificationId) => {
  try {
    const response = await axios.patch(
      `${API_URL}/notifications/${notificationId}/read`,
      {},
      {
        headers: getAuthHeaders(),
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to mark notification as read');
  }
};

export const markAllAsRead = async () => {
  try {
    const response = await axios.patch(`${API_URL}/notifications/read-all`, {}, {
      headers: getAuthHeaders(),
    });

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to mark notifications as read');
  }
};

export const getUnreadCount = async () => {
  try {
    const response = await axios.get(`${API_URL}/notifications/unread-count`, {
      headers: getAuthHeaders(),
    });

    return Number(response.data || 0);
  } catch (error) {
    return 0;
  }
};

export const clearAllNotifications = markAllAsRead;
