import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BACKEND_URL
  ? import.meta.env.VITE_BACKEND_URL.replace(/\/$/, '')
  : 'http://localhost:5001';

export const axiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,  // important for cookies
  headers: { 'Content-Type': 'application/json' }
});

export default axiosInstance;
