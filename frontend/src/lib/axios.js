import axios from 'axios';

// Backend URL - remove trailing slash to avoid double-slash issues
const BASE_URL = import.meta.env.VITE_BACKEND_URL
  ? import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '')
  : 'http://localhost:5001';

// Create axios instance
export const axiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true, // send cookies (JWT)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Export default instance
export default axiosInstance;
