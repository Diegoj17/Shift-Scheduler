// Axios.js - Versión corregida
import axios from 'axios';

// IMPORTANTE: Verifica que esta URL sea correcta para tu backend
const RAW_API_URL = import.meta?.env?.VITE_API_URL || 'https://shift-scheduler-main-production.up.railway.app/api';

// Normalizar la URL base: eliminar barras finales y manejar si la env ya incluye `/auth`
const _normalized = String(RAW_API_URL).replace(/\/+$/g, '');
// Si la URL ya termina en /auth dejamos authBase tal cual, y apiBase será la versión sin /auth.
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

// Crear instancias
const authApi = createApiInstance(authBase);
const shiftsApi = createApiInstance(API_BASE_URL);

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
      // Mostrar solo para endpoints relacionados con turnos
      const isShiftEndpoint = String(config.url).includes('/shifts');
      if (isShiftEndpoint) {
        try {
          console.debug('[shiftsApi] Outgoing request:', { method: config.method, url: config.url, data: config.data });
        } catch { /* ignore */ }
      }
    }
  } catch { /* ignore */ }
  return config;
});

// API para usuarios
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
      // Intentar crear en el endpoint REST estándar
      const response = await authApi.post('/users/', userData);
      return response.data;
    } catch {
      // Fallback a ruta con /create/ si existe
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
      // Fallback a ruta con /edit/
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
      // Fallback a ruta con /delete/
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
      // Intentar patch al recurso
      const response = await authApi.patch(`/users/${userId}/`, { status });
      return response.data;
    } catch {
      // Fallback a ruta dedicada
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

// API para turnos - CORREGIDA
export const shiftAPI = {
  // Turnos
  getShifts: async (params = {}) => {
    try {
      const response = await shiftsApi.get('/shifts/', { params });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Error al obtener turnos';
      throw new Error(message);
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

  // Tipos de Turno - CORREGIDO
  getShiftTypes: async () => {
    try {
      console.log('🔄 Solicitando tipos de turno...');
  const response = await shiftsApi.get('/api/shift-types/');
      console.log('✅ Tipos de turno recibidos:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching shift types:', error.response?.data);
      const message = error.response?.data?.detail || 
                      error.response?.data?.message || 
                      error.message || 
                      'Error al obtener tipos de turno';
      throw new Error(message);
    }
  },

  createShiftType: async (shiftTypeData) => {
    try {
      const response = await shiftsApi.post('/api/shift-types/new/', shiftTypeData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Error al crear tipo de turno';
      throw new Error(message);
    }
  },

  // Obtener un tipo de turno específico
  getShiftType: async (shiftTypeId) => {
    try {
    const response = await shiftsApi.get(`/api/shift-types/${shiftTypeId}/`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Error al obtener tipo de turno';
      throw new Error(message);
    }
  },

  // Actualizar tipo de turno
  updateShiftType: async (shiftTypeId, shiftTypeData) => {
    try {
      // Intentar PUT al recurso estándar
  const response = await shiftsApi.put(`/api/shift-types/${shiftTypeId}/edit/`, shiftTypeData);
      return response.data;
    } catch (error) {
      // Registrar el error de la ruta principal y fallback a ruta alternativa
      console.warn('updateShiftType primary route failed:', error?.response?.status || error?.message || error);
      try {
        const response2 = await shiftsApi.put(`/shift-types/${shiftTypeId}/`, shiftTypeData);
        return response2.data;
      } catch (err) {
        const message = err.response?.data?.detail || err.response?.data?.message || 'Error al actualizar tipo de turno';
        throw new Error(message);
      }
    }
  },

  // Eliminar tipo de turno
  deleteShiftType: async (shiftTypeId) => {
    try {
  const response = await shiftsApi.delete(`/api/shift-types/${shiftTypeId}/delete/`);
      return response.data;
    } catch (error) {
      // Registrar el error de la ruta principal y probar fallback a ruta sin /delete/
      console.warn('deleteShiftType primary route failed:', error?.response?.status || error?.message || error);
      try {
        const response2 = await shiftsApi.delete(`/shift-types/${shiftTypeId}/`);
        return response2.data;
      } catch (err) {
        const message = err.response?.data?.detail || err.response?.data?.message || 'Error al eliminar tipo de turno';
        throw new Error(message);
      }
    }
  },

  // Obtener empleados - intenta varias rutas conocidas para ser tolerante a distintas configuraciones del backend
  getEmployees: async () => {
    const candidatePaths = [
      '/shifts/employees/',
      '/employees/',
      '/users/',
    ];

    for (const path of candidatePaths) {
      try {
        const resp = await shiftsApi.get(path);
        if (resp && resp.data) return resp.data;
      } catch {
        // ignorar y probar siguiente
      }
    }

    // Último intento a través del authApi (si el endpoint está dentro del namespace auth)
    try {
      const resp = await authApi.get('/users/');
      if (resp && resp.data) return resp.data;
    } catch {
      // si falla, devolver null para que el frontend pueda elegir fallback
    }

    return null;
  },

  updateShift: async (shiftId, shiftData) => {
    try {
      const response = await shiftsApi.put(`/api/shifts/${shiftId}/edit/`, shiftData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Error al actualizar turno';
      throw new Error(message);
    }
  },

  deleteShift: async (shiftId) => {
    try {
      const response = await shiftsApi.delete(`/api/shifts/${shiftId}/delete/`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Error al eliminar turno';
      throw new Error(message);
    }
  },

  duplicateShifts: async (duplicateData) => {
    try {
      const response = await shiftsApi.post('/api/shifts/duplicate/', duplicateData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Error al duplicar turnos';
      throw new Error(message);
    }
  }
};

export { authApi, shiftsApi };
export default authApi;