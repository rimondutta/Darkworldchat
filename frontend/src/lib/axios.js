import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:5001'}/api`,
  withCredentials: true, // send cookies
});

// Export both the default axios and the configured instance
export default axiosInstance;
