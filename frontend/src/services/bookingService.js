import axios from 'axios';
import { getToken } from './authService';

const API_BASE_URL = 'http://localhost:8081/api';

/**
 * Booking Service - API client for booking operations
 * 
 * Handles all communication with the backend booking and resource APIs.
 * Includes token-based authentication and error handling.
 */

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = getToken() || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== RESOURCE APIs =====

/**
 * Fetch all available resources for the booking dropdown.
 * 
 * @param {Object} filters - Optional filters
 * @param {string} filters.resourceType - Filter by resource type
 * @param {string} filters.buildingId - Filter by building
 * @param {string} filters.status - Filter by status
 * @param {string} filters.search - Search by hall name
 * @returns {Promise<Array>} List of resources
 */
export const fetchResources = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.resourceType) params.append('resourceType', filters.resourceType);
    if (filters.buildingId) params.append('buildingId', filters.buildingId);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);

    const response = await api.get(`/resources?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching resources:', error);
    throw error;
  }
};

/**
 * Get a specific resource by ID.
 * 
 * @param {string} resourceId - The resource ID
 * @returns {Promise<Object>} Resource details
 */
export const getResourceById = async (resourceId) => {
  try {
    const response = await api.get(`/resources/${resourceId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching resource:', error);
    throw error;
  }
};

// ===== BOOKING APIs =====

/**
 * Create a new booking.
 * 
 * @param {Object} bookingData - Booking details
 * @param {string} bookingData.resourceId - Resource ID
 * @param {string} bookingData.date - Booking date (YYYY-MM-DD)
 * @param {string} bookingData.startTime - Start time (HH:mm)
 * @param {string} bookingData.endTime - End time (HH:mm)
 * @param {string} bookingData.purpose - Booking purpose
 * @param {number} bookingData.attendees - Number of attendees
 * @param {string} bookingData.notes - Optional notes
 * @returns {Promise<Object>} Created booking
 */
export const createBooking = async (bookingData) => {
  try {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      throw new Error('This time slot is already booked.');
    }
    console.error('Error creating booking:', error);
    throw error;
  }
};

/**
 * Get user's bookings.
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of user's bookings
 */
export const getUserBookings = async (userId) => {
  try {
    const response = await api.get(`/bookings/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
};

/**
 * Get available time slots for a resource on a specific date.
 * 
 * SMART SUGGESTION FEATURE.
 * 
 * @param {string} resourceId - Resource ID
 * @param {string} date - Date (YYYY-MM-DD)
 * @param {number} slotCount - Number of suggestions (default: 5)
 * @param {string} fromTime - Optional range start (HH:mm)
 * @param {string} toTime - Optional range end (HH:mm)
 * @returns {Promise<Array>} List of available slots
 */
export const getAvailableSlots = async (
  resourceId,
  date,
  slotCount = 5,
  fromTime,
  toTime
) => {
  try {
    const response = await api.get('/bookings/available-slots', {
      params: {
        resourceId,
        date,
        slotCount,
        fromTime,
        toTime,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching available slots:', error);
    throw error;
  }
};

/**
 * Get a single booking by ID.
 * 
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object>} Booking details
 */
export const getBookingById = async (bookingId) => {
  try {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching booking:', error);
    throw error;
  }
};

/**
 * Get all bookings for a resource.
 * 
 * @param {string} resourceId - Resource ID
 * @returns {Promise<Array>} List of bookings
 */
export const getResourceBookings = async (resourceId) => {
  try {
    const response = await api.get(`/bookings/resource/${resourceId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching resource bookings:', error);
    throw error;
  }
};

/**
 * Filter bookings by criteria.
 * 
 * @param {Object} filters - Filter parameters
 * @param {string} filters.resourceId - Filter by resource
 * @param {string} filters.date - Filter by date (YYYY-MM-DD)
 * @param {string} filters.status - Filter by status
 * @returns {Promise<Array>} Filtered bookings
 */
export const filterBookings = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.resourceId) params.append('resourceId', filters.resourceId);
    if (filters.date) params.append('date', filters.date);
    if (filters.status) params.append('status', filters.status);

    const response = await api.get(`/bookings/filter?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error filtering bookings:', error);
    throw error;
  }
};

/**
 * Update booking status (admin only).
 * 
 * @param {string} bookingId - Booking ID
 * @param {string} status - New status (APPROVED, REJECTED, CANCELLED)
 * @param {string} reason - Reason for the change
 * @returns {Promise<Object>} Updated booking
 */
export const updateBookingStatus = async (bookingId, status, reason) => {
  try {
    const response = await api.put(`/bookings/${bookingId}/status`, {
      status,
      reason,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw error;
  }
};

/**
 * Cancel a booking (user only).
 * 
 * @param {string} bookingId - Booking ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Object>} Cancelled booking
 */
export const cancelBooking = async (bookingId, reason) => {
  try {
    const response = await api.delete(`/bookings/${bookingId}`, {
      params: { reason },
    });
    return response.data;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
};

/**
 * Get pending bookings (admin only).
 * 
 * @returns {Promise<Array>} List of pending bookings
 */
export const getPendingBookings = async () => {
  try {
    const response = await api.get('/bookings/pending');
    return response.data;
  } catch (error) {
    console.error('Error fetching pending bookings:', error);
    throw error;
  }
};

/**
 * Get all bookings (admin only).
 * 
 * @returns {Promise<Array>} List of all bookings
 */
export const getAllBookings = async () => {
  try {
    const response = await api.get('/bookings');
    return response.data;
  } catch (error) {
    console.error('Error fetching all bookings:', error);
    throw error;
  }
};

export default {
  fetchResources,
  getResourceById,
  createBooking,
  getUserBookings,
  getAvailableSlots,
  getBookingById,
  getResourceBookings,
  filterBookings,
  updateBookingStatus,
  cancelBooking,
  getPendingBookings,
  getAllBookings,
};
