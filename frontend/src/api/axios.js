import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const skipLogout = error.config?.headers?.['x-skip-logout'];
    if (error.response?.status === 401 && !skipLogout) {
      localStorage.removeItem('lms_token');
      localStorage.removeItem('lms_admin');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default api;
