// Axios.js - VERSIÓN COMPLETA CON SISTEMA DE RECORDATORIOS
import axios from 'axios';

const RAW_API_URL = import.meta?.env?.VITE_API_URL || 'https://shift-scheduler-main-production.up.railway.app/api';

// Normalizar la URL base
const API_BASE_URL = String(RAW_API_URL).replace(/\/+$/g, '');

// Log para debugging
console.debug('🔧 API URL config:', { RAW_API_URL, API_BASE_URL });

// Configuración base de Axios
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
    }
    return config;
  });

  // Interceptor de respuesta para errores
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
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
    }
  );

  return instance;
};

// Crear instancias - CORREGIDO
const authApi = createApiInstance(API_BASE_URL + '/auth');
const shiftsApi = createApiInstance(API_BASE_URL + '/shifts');    // ← SIN /auth/
const notificationsApi = createApiInstance(API_BASE_URL + '/notifications'); // ← SIN /auth/

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

// Aplicar interceptores de error a todas las instancias
authApi.interceptors.response.use(r => r, handleResponseError);
shiftsApi.interceptors.response.use(r => r, handleResponseError);
notificationsApi.interceptors.response.use(r => r, handleResponseError);

// Logging temporal de requests salientes (solo en DEV)
const addRequestLogging = (apiInstance, apiName) => {
  apiInstance.interceptors.request.use((config) => {
    try {
      if (import.meta?.env?.DEV) {
        console.debug(`[${apiName}] Outgoing request:`, { 
          method: config.method, 
          url: config.url, 
          fullURL: config.baseURL + config.url,
          data: config.data 
        });
      }
    } catch { /* ignore */ }
    return config;
  });
};

addRequestLogging(shiftsApi, 'shiftsApi');
addRequestLogging(notificationsApi, 'notificationsApi');

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
    // Intento directo al endpoint que el backend expone para creación
    const response = await authApi.post('/users/create/', userData);
    return response.data;
  } catch  {
    // Si por alguna razón falla, intentar el path alternativo /users/
    try {
      const response2 = await authApi.post('/users/', userData);
      return response2.data;
    } catch (err2) {
      const message = err2.response?.data?.detail || err2.response?.data?.message || 'Error al crear usuario';
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
// API para turnos - VERSIÓN COMPLETA CON RECORDATORIOS
// ==========================================
export const shiftAPI = {
  // TURNOS
  getShifts: async (params = {}) => {
    try {
      console.log('🔄 Obteniendo turnos...');
      const response = await shiftsApi.get('/shifts/', { params });
      console.log('✅ Turnos obtenidos:', response.data?.length || 0);
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo turnos:', error.response?.status, error.response?.data);
      throw new Error(error.response?.data?.detail || 'No se pudo conectar con el servidor de turnos');
    }
  },

  getMyShifts: async (params = {}) => {
    try {
      console.log('🔄 Obteniendo mis turnos...');
      const response = await shiftsApi.get('/shifts/my/', { params });
      console.log('✅ Mis turnos obtenidos:', response.data?.results?.length || response.data?.length || 0);
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo mis turnos:', error.response?.status, error.response?.data);
      throw new Error(error.response?.data?.detail || 'No se pudo obtener tus turnos');
    }
  },
  
  getShift: async (shiftId) => {
    try {
      const response = await shiftsApi.get(`/shifts/${shiftId}/`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Error al obtener turno';
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

  // ✅ NUEVO: SISTEMA DE RECORDATORIOS
  testReminders: async () => {
    try {
      console.log('🧪 Probando sistema de recordatorios...');
      const response = await shiftsApi.post('/shifts/test-reminders/');
      console.log('✅ Test de recordatorios completado:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error probando recordatorios:', error.response?.status, error.response?.data);
      const message = error.response?.data?.error || error.response?.data?.detail || 'Error probando recordatorios';
      throw new Error(message);
    }
  },

  scheduleAllReminders: async () => {
    try {
      console.log('🔄 Reprogramando todos los recordatorios...');
      const response = await shiftsApi.post('/shifts/schedule-reminders/');
      console.log('✅ Recordatorios reprogramados:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error reprogramando recordatorios:', error.response?.status, error.response?.data);
      const message = error.response?.data?.error || error.response?.data?.detail || 'Error reprogramando recordatorios';
      throw new Error(message);
    }
  },

  getRemindersInfo: async () => {
    try {
      console.log('📊 Obteniendo información de recordatorios...');
      // Este endpoint podría crearse en el backend para obtener estadísticas
      const response = await shiftsApi.get('/shifts/reminders-info/');
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo información de recordatorios:', error.response?.status, error.response?.data);
      // Si el endpoint no existe, retornar datos por defecto
      return {
        total_reminders: 0,
        pending_reminders: 0,
        sent_reminders: 0,
        coverage_percentage: 0
      };
    }
  },

  // TIPOS DE TURNO
  getShiftTypes: async () => {
    try {
      console.log('🔄 Solicitando tipos de turno...');
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

  // DISPONIBILIDADES
  createAvailability: async (availabilityData) => {
    const response = await shiftsApi.post('/availability/new/', availabilityData);
    return response.data;
  },

  getAvailabilities: async (params = {}) => {
    const response = await shiftsApi.get('/availability/', { params });
    return response.data;
  },

  updateAvailability: async (availabilityId, availabilityData) => {
    const response = await shiftsApi.put(`/availability/${availabilityId}/edit/`, availabilityData);
    return response.data;
  },

  deleteAvailability: async (availabilityId) => {
    const response = await shiftsApi.delete(`/availability/${availabilityId}/delete/`);
    return response.data;
  },

  checkEmployeeAvailability: async (checkData) => {
    const response = await shiftsApi.post('/availability/check/', checkData);
    return response.data;
  }
};

// ==========================================
// API para NOTIFICACIONES - VERSIÓN COMPLETA CON RECORDATORIOS
// ==========================================
export const notificationAPI = {
  // NOTIFICACIONES
  getNotifications: async (params = {}) => {
    try {
      console.log('🔄 Obteniendo notificaciones...');
      const response = await notificationsApi.get('/notifications/', { params });
      console.log('✅ Notificaciones obtenidas:', response.data?.notifications?.length || 0);
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo notificaciones:', error.response?.status, error.response?.data);
      throw new Error(error.response?.data?.detail || 'No se pudo obtener las notificaciones');
    }
  },

  getNotification: async (notificationId) => {
    try {
      const response = await notificationsApi.get(`/notifications/${notificationId}/`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Error al obtener notificación';
      throw new Error(message);
    }
  },

  markAsRead: async (notificationId) => {
    try {
      const response = await notificationsApi.post(`/notifications/${notificationId}/mark_as_read/`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Error al marcar notificación como leída';
      throw new Error(message);
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await notificationsApi.post('/notifications/mark_all_as_read/');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Error al marcar todas como leídas';
      throw new Error(message);
    }
  },

  deleteNotification: async (notificationId) => {
    try {
      const response = await notificationsApi.delete(`/notifications/${notificationId}/`);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Error al eliminar notificación';
      throw new Error(message);
    }
  },

  deleteAllRead: async () => {
    try {
      const response = await notificationsApi.delete('/notifications/delete_all_read/');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.message || 'Error al eliminar notificaciones leídas';
      throw new Error(message);
    }
  },

  getUnreadCount: async () => {
    try {
      const response = await notificationsApi.get('/notifications/unread_count/');
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo conteo de no leídas:', error.response?.status, error.response?.data);
      // En caso de error, retornar 0 para no romper la UI
      return { unread_count: 0 };
    }
  },

  // ✅ NUEVO: MÉTODOS ESPECÍFICOS PARA RECORDATORIOS
  getReminderNotifications: async (limit = 20) => {
    try {
      console.log('⏰ Obteniendo notificaciones de recordatorios...');
      const response = await notificationsApi.get('/notifications/', {
        params: { 
          type: 'shift_reminder',
          limit,
          ordering: '-created_at'
        }
      });
      console.log('✅ Notificaciones de recordatorios obtenidas:', response.data?.notifications?.length || 0);
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo notificaciones de recordatorios:', error.response?.status, error.response?.data);
      throw new Error(error.response?.data?.detail || 'No se pudo obtener las notificaciones de recordatorios');
    }
  },

  getNotificationsByType: async (type, limit = 20) => {
    try {
      console.log(`🔔 Obteniendo notificaciones de tipo: ${type}`);
      const response = await notificationsApi.get('/notifications/', {
        params: { 
          type,
          limit,
          ordering: '-created_at'
        }
      });
      console.log(`✅ Notificaciones de tipo ${type} obtenidas:`, response.data?.notifications?.length || 0);
      return response.data;
    } catch (error) {
      console.error(`❌ Error obteniendo notificaciones de tipo ${type}:`, error.response?.status, error.response?.data);
      throw new Error(error.response?.data?.detail || `No se pudo obtener las notificaciones de tipo ${type}`);
    }
  },

  // PREFERENCIAS DE NOTIFICACIÓN
  getPreferences: async () => {
    try {
      console.log('🔄 Obteniendo preferencias de notificación...');
      const response = await notificationsApi.get('/preferences/');
      console.log('✅ Preferencias obtenidas');
      return response.data;
    } catch (error) {
      console.error('❌ Error obteniendo preferencias:', error.response?.status, error.response?.data);
      throw new Error(error.response?.data?.detail || 'No se pudo obtener las preferencias');
    }
  },

  updatePreferences: async (preferences) => {
    try {
      console.log('🔄 Actualizando preferencias...');
      const response = await notificationsApi.put('/preferences/update_preferences/', preferences);
      console.log('✅ Preferencias actualizadas');
      return response.data;
    } catch (error) {
      console.error('❌ Error actualizando preferencias:', error.response?.status, error.response?.data);
      const message = error.response?.data?.detail || error.response?.data?.message || 'Error al actualizar preferencias';
      throw new Error(message);
    }
  },

  updatePreferencesPartial: async (preferences) => {
    try {
      console.log('🔄 Actualizando preferencias (PATCH)...');
      const response = await notificationsApi.patch('/preferences/update_preferences/', preferences);
      console.log('✅ Preferencias actualizadas');
      return response.data;
    } catch (error) {
      console.error('❌ Error actualizando preferencias:', error.response?.status, error.response?.data);
      const message = error.response?.data?.detail || error.response?.data?.message || 'Error al actualizar preferencias';
      throw new Error(message);
    }
  }
};

// ==========================================
// Servicio de notificaciones para compatibilidad
// ==========================================
export const notificationService = {
  /**
   * Obtiene todas las notificaciones del usuario
   */
  async getNotifications(params = {}) {
    return await notificationAPI.getNotifications(params);
  },

  /**
   * Obtiene solo notificaciones no leídas
   */
  async getUnreadNotifications(limit = 10) {
    return await notificationAPI.getNotifications({ 
      is_read: false, 
      limit 
    });
  },

  /**
   * Obtiene el conteo de notificaciones no leídas
   */
  async getUnreadCount() {
    const response = await notificationAPI.getUnreadCount();
    return response.unread_count;
  },

  /**
   * Marca una notificación como leída
   */
  async markAsRead(notificationId) {
    return await notificationAPI.markAsRead(notificationId);
  },

  /**
   * Marca todas las notificaciones como leídas
   */
  async markAllAsRead() {
    return await notificationAPI.markAllAsRead();
  },

  /**
   * Elimina una notificación
   */
  async deleteNotification(notificationId) {
    return await notificationAPI.deleteNotification(notificationId);
  },

  /**
   * Elimina todas las notificaciones leídas
   */
  async deleteAllRead() {
    return await notificationAPI.deleteAllRead();
  },

  /**
   * Obtiene las preferencias de notificación del usuario
   */
  async getPreferences() {
    return await notificationAPI.getPreferences();
  },

  /**
   * Actualiza las preferencias de notificación
   */
  async updatePreferences(preferences) {
    return await notificationAPI.updatePreferences(preferences);
  },

  // ✅ NUEVO: MÉTODOS PARA RECORDATORIOS
  async getReminderNotifications(limit = 20) {
    return await notificationAPI.getReminderNotifications(limit);
  },

  async getNotificationsByType(type, limit = 20) {
    return await notificationAPI.getNotificationsByType(type, limit);
  }
};

export { authApi, shiftsApi, notificationsApi };
export default authApi;