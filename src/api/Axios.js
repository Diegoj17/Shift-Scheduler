import axios from 'axios';

// Usar variable de entorno o fallback a localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://shift-scheduler-main-production.up.railway.app/api/auth';

// Configuración base de axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor para agregar el token automáticamente
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const userAPI = {
  getUsers: async () => {
    try {
      const response = await apiClient.get('/users/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Error al obtener usuarios');
    }
  },

  createUser: async (userData) => {
    try {
      const response = await apiClient.post('/users/create', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateUser: async (userId, userData) => {
    try {
      const response = await apiClient.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await apiClient.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Error al eliminar usuario');
    }
  },

  updateUserStatus: async (userId, status) => {
    try {
      const response = await apiClient.patch(`/users/${userId}`, { status });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Error al actualizar estado');
    }
  }
};

export default apiClient;
