import axios from 'axios';
import { getToken } from './authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${getToken()}` },
});

const buildQuery = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && `${value}`.trim() !== '') {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
};

export const getBuildings = async () => {
  const response = await axios.get(`${API_BASE}/admin/buildings`, authHeaders());
  return response.data;
};

export const getBuildingById = async (id) => {
  const response = await axios.get(`${API_BASE}/admin/buildings/${id}`, authHeaders());
  return response.data;
};

export const createBuilding = async (data) => {
  const response = await axios.post(`${API_BASE}/admin/buildings`, data, authHeaders());
  return response.data;
};

export const updateBuilding = async (id, data) => {
  const response = await axios.put(`${API_BASE}/admin/buildings/${id}`, data, authHeaders());
  return response.data;
};

export const deleteBuilding = async (id) => {
  const response = await axios.delete(`${API_BASE}/admin/buildings/${id}`, authHeaders());
  return response.data;
};

export const checkBuildingName = async (buildingName) => {
  const response = await axios.get(
    `${API_BASE}/admin/buildings/check-name${buildQuery({ buildingName })}`,
    authHeaders()
  );
  return response.data;
};

export const getResources = async (filters = {}) => {
  const response = await axios.get(`${API_BASE}/admin/resources${buildQuery(filters)}`, authHeaders());
  return response.data;
};

export const getResourceById = async (id) => {
  const response = await axios.get(`${API_BASE}/admin/resources/${id}`, authHeaders());
  return response.data;
};

export const createResource = async (data) => {
  const response = await axios.post(`${API_BASE}/admin/resources`, data, authHeaders());
  return response.data;
};

export const updateResource = async (id, data) => {
  const response = await axios.put(`${API_BASE}/admin/resources/${id}`, data, authHeaders());
  return response.data;
};

export const deleteResource = async (id) => {
  const response = await axios.delete(`${API_BASE}/admin/resources/${id}`, authHeaders());
  return response.data;
};

export const checkHallName = async (hallName) => {
  const response = await axios.get(
    `${API_BASE}/admin/resources/check-hall-name${buildQuery({ hallName })}`,
    authHeaders()
  );
  return response.data;
};