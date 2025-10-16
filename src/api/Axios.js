import axios from 'axios';

const API_BASE_URL =
  (import.meta.env?.VITE_API_BASE_URL?.trim())
    ? import.meta.env.VITE_API_BASE_URL.trim()
    : 'http://127.0.0.1:8000/api/auth';

console.log('[API] baseURL =', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  // Diagnóstico (quitar luego):
  // console.log('[API] =>', cfg.method?.toUpperCase(), (cfg.baseURL||'')+(cfg.url||''));
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401) {
      localStorage.removeItem('token'); localStorage.removeItem('refresh');
      if (!location.pathname.startsWith('/login')) location.href = '/login';
    }
    return Promise.reject(e);
  }
);

export default api;
