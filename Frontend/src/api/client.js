import axios from 'axios';

// Always use the full backend URL for API calls
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      // Token invalid/expired or not authorized — clear session and redirect to login
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch {}
      if (typeof window !== 'undefined') {
        const msg = status === 401 ? 'Please sign in again.' : 'Your session is invalid or expired. Please sign in again.';
        const params = new URLSearchParams({ message: msg });
        window.location.assign(`/login?${params.toString()}`);
      }
    }
    return Promise.reject(error);
  }
);

export default client;

