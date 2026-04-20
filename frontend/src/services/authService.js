import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

// Campus email pattern: 2 letters (case-insensitive) + 8 digits + @my.sliit.lk
// Examples: IT12345678@my.sliit.lk, it12345678@my.sliit.lk, CS87654321@my.sliit.lk
const CAMPUS_EMAIL_PATTERN = /^[A-Za-z]{2}\d{8}@my\.sliit\.lk$/;

// Token storage key
const TOKEN_KEY = 'smartcampus_token';
const USER_KEY = 'smartcampus_user';

// Session storage keys (per-tab, not shared across tabs)
const SESSION_TOKEN_KEY = 'smartcampus_session_token';
const SESSION_USER_KEY = 'smartcampus_session_user';

/**
 * Validate campus email format
 */
export const isValidCampusEmail = (email) => {
  if (!email || email.trim() === '') {
    return false;
  }
  return CAMPUS_EMAIL_PATTERN.test(email.trim());
};

/**
 * Store authentication token
 */
export const setToken = (token) => {
  sessionStorage.setItem(SESSION_TOKEN_KEY, token);
};

/**
 * Get stored authentication token
 */
export const getToken = () => {
  return sessionStorage.getItem(SESSION_TOKEN_KEY);
};

/**
 * Remove authentication token
 */
export const removeToken = () => {
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
};

/**
 * Store user data
 */
export const setUser = (user) => {
  sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
};

/**
 * Get stored user data
 */
export const getUser = () => {
  const userStr = sessionStorage.getItem(SESSION_USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Remove user data
 */
export const removeUser = () => {
  sessionStorage.removeItem(SESSION_USER_KEY);
};

/**
 * Register a new user
 */
export const register = async (name, email, password, phone) => {
  try {
    const response = await axios.post(`${API_BASE}/auth/register`, {
      name,
      email,
      password,
      phone,
    });

    const data = response.data;

    // Store token and user data
    setToken(data.token);
    setUser(data.user);

    return data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Registration failed');
  }
};

/**
 * Login with email and password
 */
export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email,
      password,
    });

    const data = response.data;

    // Store token and user data
    setToken(data.token);
    setUser(data.user);

    return data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Login failed');
  }
};

/**
 * Login with Google OAuth
 */
export const googleLogin = () => {
  // Directly redirect to the Spring Security OAuth2 initiation endpoint
  const oauthBase = API_BASE.replace('/api', '');
  window.location.href = `${oauthBase}/oauth2/authorization/google`;
};

/**
 * Get current user profile
 */
export const getProfile = async () => {
  const token = getToken();

  if (!token) {
    throw new Error('No authentication token');
  }

  try {
    const response = await axios.get(`${API_BASE}/user/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = response.data;

    // Update stored user data
    setUser(data);

    return data;
  } catch (error) {
    if (error.response?.status === 401) {
      logout();
      throw new Error('Session expired. Please login again.');
    }
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch profile');
  }
};

// Staff login (NEW)
export const staffLogin = async (username, password) => {
  const response = await axios.post(`${API_BASE}/auth/staff/login`, { username, password });
  return response.data;
};

// Change password (all roles)
export const changePassword = async (currentPassword, newPassword, confirmNewPassword) => {
  const response = await axios.post(
    `${API_BASE}/user/change-password`,
    { currentPassword, newPassword, confirmNewPassword },
    { headers: { Authorization: `Bearer ${getToken()}` } }
  );
  return response.data;
};

/**
 * Logout user
 */
export const logout = () => {
  removeToken();
  removeUser();
  window.location.href = '/login';
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Check if user has required role
 */
export const hasRole = (requiredRole) => {
  const user = getUser();
  return user && user.role === requiredRole;
};
