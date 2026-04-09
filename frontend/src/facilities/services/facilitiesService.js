import axios from 'axios';
import { getToken } from '../../services/authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

export const getStudyAreasForUser = async () => {
  const response = await axios.get(`${API_BASE}/user/study-areas`, authHeaders());
  return response.data;
};

export const checkInUserLocation = async (latitude, longitude) => {
  const response = await axios.post(
    `${API_BASE}/user/location/check-in`,
    { latitude, longitude },
    authHeaders(),
  );
  return response.data;
};

export const getStudyAreaOccupancy = async () => {
  const response = await axios.get(`${API_BASE}/user/study-areas/occupancy`, authHeaders());
  return response.data;
};

export const getStudyAreaActiveMembers = async () => {
  const response = await axios.get(`${API_BASE}/user/study-areas/active-members`, authHeaders());
  return response.data;
};
