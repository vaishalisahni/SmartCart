import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

// Attach token
API.interceptors.request.use(config => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401 — never retry auth endpoints (prevents infinite loop)
API.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;
    const isAuthEndpoint = original.url?.includes('/auth/');
    if (err.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        const base = import.meta.env.VITE_API_URL || '/api';
        const { data } = await axios.post(`${base}/auth/refresh`, {}, { withCredentials: true });
        localStorage.setItem('accessToken', data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return API(original);
      } catch {
        localStorage.removeItem('accessToken');
        // silent fail — don't redirect, let the UI handle unauthenticated state
      }
    }
    return Promise.reject(err);
  }
);

export default API;