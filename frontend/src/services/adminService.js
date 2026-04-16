import axios from 'axios';
import { getToken } from './authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

export const createTechnician = async (data) => {
  const response = await axios.post(`${API_BASE}/admin/technicians`, data, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return response.data;
};

export const getAllTechnicians = async () => {
  const response = await axios.get(`${API_BASE}/admin/technicians`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return response.data;
};

export const checkUsernameAvailability = async (username) => {
  const response = await axios.get(
    `${API_BASE}/admin/technicians/check-username?username=${username}`,
    { headers: { Authorization: `Bearer ${getToken()}` } }
  );
  return response.data;
};

export const updateTechnician = async (id, data) => {
  const response = await axios.put(`${API_BASE}/admin/technicians/${id}`, data, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return response.data;
};

export const deactivateTechnician = async (id) => {
  const response = await axios.delete(`${API_BASE}/admin/technicians/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return response.data;
};
