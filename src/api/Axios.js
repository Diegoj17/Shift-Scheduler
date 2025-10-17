// api/Axios.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/auth';

// Configuración base de axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token automáticamente
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Cambiado a 'token' para coincidir con authService
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
      // Token expirado o inválido
      localStorage.removeItem('token');
      localStorage.removeItem('refresh');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const userAPI = {
  // GET - Obtener todos los usuarios
  getUsers: async () => {
    try {
      const response = await apiClient.get('/users/');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Error al obtener usuarios');
    }
  },

  // POST - Crear usuario
  createUser: async (userData) => {
    try {
      const response = await apiClient.post('/users/create', userData);
      return response.data;
    } catch (error) {
      throw error; // Lanzar el error completo para manejar mejor los detalles
    }
  },

  // PUT - Actualizar usuario completo
  updateUser: async (userId, userData) => {
    try {
      const response = await apiClient.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // DELETE - Eliminar usuario
  deleteUser: async (userId) => {
    try {
      const response = await apiClient.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.detail || 'Error al eliminar usuario');
    }
  },

  // PATCH - Actualizar estado del usuario (bloquear/desbloquear)
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