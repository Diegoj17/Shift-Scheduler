// Axios.js - Versión corregida
import axios from 'axios';

// IMPORTANTE: Verifica que esta URL sea correcta para tu backend
const RAW_API_URL = import.meta?.env?.VITE_API_URL || 'https://shift-scheduler-main-production.up.railway.app/api';

// Normalizar la URL base: eliminar barras finales y manejar si la env ya incluye `/auth`
const _normalized = String(RAW_API_URL).replace(/\/+$/g, '');
const authBase = _normalized.endsWith('/auth') ? _normalized : `${_normalized}/auth`;
const apiBase = _normalized.endsWith('/auth') ? _normalized.replace(/\/auth$/, '') : _normalized;

const API_BASE_URL = apiBase;

// Log para facilitar debugging en producción (se puede remover después)
console.debug('API URL config:', { RAW_API_URL, API_BASE_URL, authBase });

// Helper para leer cookies
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Configuración SIMPLIFICADA - sin CSRF complejo
const createApiInstance = (baseURL) => {
  const instance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: false,
    timeout: 15000,
  });

  // Interceptor para token
  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Token añadido a la petición');
    } else {
      console.warn('⚠️ No se encontró token en localStorage');
    }
    return config;
  });

  return instance;
};

// Crear instancias - CORREGIDO
const authApi = createApiInstance(authBase); // https://.../api/auth
const shiftsApi = createApiInstance(API_BASE_URL + '/shifts'); // https://.../api/shifts

// Interceptor de respuestas para manejar errores
const handleResponseError = (error) => {
  console.error('API Error:', {
    status: error.response?.status,
    data: error.response?.data,
    url: error.config?.url
  });

  if (error.response?.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  
  return Promise.reject(error);
};

authApi.interceptors.response.use(r => r, handleResponseError);
shiftsApi.interceptors.response.use(r => r, handleResponseError);

// Logging temporal de requests salientes del cliente (solo en DEV)
shiftsApi.interceptors.request.use((config) => {
  try {
    if (import.meta?.env?.DEV) {
      const isShiftEndpoint = String(config.url).includes('/shift');
      if (isShiftEndpoint) {
        try {
          console.debug('[shiftsApi] Outgoing request:', { 
            method: config.method, 
            url: config.url, 
            fullURL: config.baseURL + config.url,
            data: config.data 
          });
        } catch { /* ignore */ }
      }
    }
  } catch { /* ignore */ }
  return config;
});

// ==========================================
// API para usuarios
// ==========================================
export const userAPI = {
  getUsers: async () => {
    try {
      const response = await authApi.get('/users/');
      return response.data;
    } catch {
      throw new Error('Error al obtener usuarios');
    }
  },
  
  createUser: async (userData) => {
    try {
      const response = await authApi.post('/users/', userData);
      return response.data;
    } catch {
      try {
        const response2 = await authApi.post('/users/create/', userData);
        return response2.data;
      } catch (err) {
        const message = err.response?.data?.detail || err.response?.data?.message || 'Error al crear usuario';
        throw new Error(message);
      }
    }
  },
  
  updateUser: async (userId, userData) => {
    try {
      const response = await authApi.put(`/users/${userId}/`, userData);
      return response.data;
    } catch {
      try {
        const response2 = await authApi.put(`/users/${userId}/edit/`, userData);
        return response2.data;
      } catch (err) {
        const message = err.response?.data?.detail || err.response?.data?.message || 'Error al actualizar usuario';
        throw new Error(message);
      }
    }
  },
  
  deleteUser: async (userId) => {
    try {
      const response = await authApi.delete(`/users/${userId}/`);
      return response.data;
    } catch {
      try {
        const response2 = await authApi.delete(`/users/${userId}/delete/`);
        return response2.data;
      } catch (err) {
        const message = err.response?.data?.detail || err.response?.data?.message || 'Error al eliminar usuario';
        throw new Error(message);
      }
    }
  },
  
  updateUserStatus: async (userId, status) => {
    try {
      const response = await authApi.patch(`/users/${userId}/`, { status });
      return response.data;
    } catch {
      try {
        const response2 = await authApi.put(`/users/${userId}/status/`, { status });
        return response2.data;
      } catch (err) {
        const message = err.response?.data?.detail || err.response?.data?.message || 'Error al actualizar estado de usuario';
        throw new Error(message);
      }
    }
  },
};

// ==========================================
// API para turnos - VERSIÓN CORREGIDA
// ==========================================
export const shiftAPI = {
  // TURNOS
  getShifts: async (params = {}) => {
    try {
      console.log('🔄 Obteniendo turnos...');
      // shiftsApi baseURL: /api/shifts → /api/shifts/shifts/
      const response = await shiftsApi.get('/shifts/', { params });
      console.log('✅ Turnos obtenidos:', response.data?.length || 0);
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo turnos:', error.response?.status, error.response?.data);
      throw new Error(error.response?.data?.detail || 'No se pudo conectar con el servidor de turnos');
    }
  },

  createShift: async (shiftData) => {
    try {
      const response = await shiftsApi.post('/shifts/new/', shiftData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Error al crear turno';
      throw new Error(message);
    }
  },

  updateShift: async (shiftId, shiftData) => {
    try {
      const response = await shiftsApi.put(`/shifts/${shiftId}/edit/`, shiftData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Error al actualizar turno';
      throw new Error(message);
    }
  },

  deleteShift: async (shiftId) => {
    try {
      const response = await shiftsApi.delete(`/shifts/${shiftId}/delete/`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Error al eliminar turno';
      throw new Error(message);
    }
  },

  duplicateShifts: async (duplicateData) => {
    try {
      const response = await shiftsApi.post('/shifts/duplicate/', duplicateData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Error al duplicar turnos';
      throw new Error(message);
    }
  },

  // TIPOS DE TURNO
  getShiftTypes: async () => {
    try {
      console.log('🔄 Solicitando tipos de turno...');
      // shiftsApi baseURL: /api/shifts → /api/shifts/shift-types/
      const response = await shiftsApi.get('/shift-types/');
      console.log('✅ Tipos de turno recibidos:', response.data?.length || 0);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching shift types:', error.response?.status, error.response?.data);
      const message = error.response?.data?.detail || 
                      error.response?.data?.message || 
                      error.message || 
                      'Error al obtener tipos de turno';
      throw new Error(message);
    }
  },

  createShiftType: async (shiftTypeData) => {
    try {
      const response = await shiftsApi.post('/shift-types/new/', shiftTypeData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Error al crear tipo de turno';
      throw new Error(message);
    }
  },

  getShiftType: async (shiftTypeId) => {
    try {
      const response = await shiftsApi.get(`/shift-types/${shiftTypeId}/`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Error al obtener tipo de turno';
      throw new Error(message);
    }
  },

  updateShiftType: async (shiftTypeId, shiftTypeData) => {
    try {
      const response = await shiftsApi.put(`/shift-types/${shiftTypeId}/edit/`, shiftTypeData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Error al actualizar tipo de turno';
      throw new Error(message);
    }
  },

  deleteShiftType: async (shiftTypeId) => {
    try {
      const response = await shiftsApi.delete(`/shift-types/${shiftTypeId}/delete/`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Error al eliminar tipo de turno';
      throw new Error(message);
    }
  },
};

export { authApi, shiftsApi };
export default authApi;
