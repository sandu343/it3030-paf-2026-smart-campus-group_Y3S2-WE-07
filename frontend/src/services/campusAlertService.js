import axios from 'axios';
import { getToken } from './authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

export const createCampusAlert = async (payload) => {
  const response = await axios.post(`${API_BASE}/admin/campus-alerts`, payload, authHeaders());
  return response.data;
};

export const updateCampusAlert = async (alertId, payload) => {
  const response = await axios.put(`${API_BASE}/admin/campus-alerts/${alertId}`, payload, authHeaders());
  return response.data;
};

export const deleteCampusAlert = async (alertId) => {
  const response = await axios.delete(`${API_BASE}/admin/campus-alerts/${alertId}`, authHeaders());
  return response.data;
};

export const getAdminCampusAlerts = async () => {
  const response = await axios.get(`${API_BASE}/admin/campus-alerts`, authHeaders());
  return response.data;
};

export const getActiveCampusAlerts = async () => {
  const response = await axios.get(`${API_BASE}/campus-alerts/active`, authHeaders());
  return response.data;
};
