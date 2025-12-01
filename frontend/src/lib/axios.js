import axios from 'axios';

// Backend URL - remove trailing slash to avoid double-slash
const BASE_URL = import.meta.env.VITE_BACKEND_URL
  ? import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '')
  : 'http://localhost:5001';

export const axiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true, // send cookies (JWT)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Export default
export default axiosInstance;
