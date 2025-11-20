import { notificationsApi } from '../api/Axios';

const notificationService = {
  /**
   * Obtiene todas las notificaciones del usuario
   */
  async getNotifications(params = {}) {
    try {
      const response = await notificationsApi.get('/notifications/', { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      throw error;
    }
  },

  /**
   * Obtiene solo notificaciones no leídas
   */
  async getUnreadNotifications(limit = 10) {
    try {
      const response = await notificationsApi.get('/notifications/', {
        params: { is_read: false, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo notificaciones no leídas:', error);
      throw error;
    }
  },

  /**
   * Obtiene el conteo de notificaciones no leídas
   */
  async getUnreadCount() {
    try {
      const response = await notificationsApi.get('/notifications/unread_count/');
      return response.data.unread_count;
    } catch (error) {
      console.error('Error obteniendo conteo de no leídas:', error);
      return 0;
    }
  },

  /**
   * Marca una notificación como leída
   */
  async markAsRead(notificationId) {
    try {
      const response = await notificationsApi.post(`/notifications/${notificationId}/mark_as_read/`);
      return response.data;
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      throw error;
    }
  },

  /**
   * Marca todas las notificaciones como leídas
   */
  async markAllAsRead() {
    try {
      const response = await notificationsApi.post('/notifications/mark_all_as_read/');
      return response.data;
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
      throw error;
    }
  },

  /**
   * Elimina una notificación
   */
  async deleteNotification(notificationId) {
    try {
      await notificationsApi.delete(`/notifications/${notificationId}/`);
      return true;
    } catch (error) {
      console.error('Error eliminando notificación:', error);
      throw error;
    }
  },

  /**
   * Elimina todas las notificaciones leídas
   */
  async deleteAllRead() {
    try {
      const response = await notificationsApi.delete('/notifications/delete_all_read/');
      return response.data;
    } catch (error) {
      console.error('Error eliminando notificaciones leídas:', error);
      throw error;
    }
  },

  /**
   * Obtiene las preferencias de notificación del usuario
   */
  async getPreferences() {
    try {
      const response = await notificationsApi.get('/preferences/');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo preferencias:', error);
      throw error;
    }
  },

  /**
   * Actualiza las preferencias de notificación
   */
  async updatePreferences(preferences) {
    try {
      const response = await notificationsApi.put('/preferences/update_preferences/', preferences);
      return response.data;
    } catch (error) {
      console.error('Error actualizando preferencias:', error);
      throw error;
    }
  },

  /**
   * Actualiza parcialmente las preferencias (PATCH)
   */
  async updatePreferencesPartial(preferences) {
    try {
      const response = await notificationsApi.patch('/preferences/update_preferences/', preferences);
      return response.data;
    } catch (error) {
      console.error('Error actualizando preferencias (PATCH):', error);
      throw error;
    }
  }
};

export default notificationService;