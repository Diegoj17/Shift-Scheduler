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
      console.error('❌ [notificationService] Error obteniendo notificaciones:', error);
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
      const unreadCount = response.data?.notifications?.filter(n => !n.is_read).length || 
                          response.data?.results?.filter(n => !n.is_read).length || 0;
      return response.data;
    } catch (error) {
      console.error('❌ [notificationService] Error obteniendo notificaciones no leídas:', error);
      throw error;
    }
  },

  /**
   * Obtiene el conteo de notificaciones no leídas
   */
  async getUnreadCount() {
    try {
      const response = await notificationsApi.get('/notifications/unread_count/');
      const count = response.data.unread_count || 0;
      return count;
    } catch (error) {
      console.error('❌ [notificationService] Error obteniendo conteo de no leídas:', error);
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
      console.error(`❌ [notificationService] Error marcando notificación ${notificationId} como leída:`, error);
      throw error;
    }
  },

  /**
   * Marca todas las notificaciones como leídas
   */
  async markAllAsRead() {
    try {
      const response = await notificationsApi.post('/notifications/mark_all_as_read/');
      const updatedCount = response.data?.updated_count || 0;
      return response.data;
    } catch (error) {
      console.error('❌ [notificationService] Error marcando todas como leídas:', error);
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
      console.error(`❌ [notificationService] Error eliminando notificación ${notificationId}:`, error);
      throw error;
    }
  },

  /**
   * Elimina todas las notificaciones leídas
   */
  async deleteAllRead() {
    try {
      const response = await notificationsApi.delete('/notifications/delete_all_read/');
      const deletedCount = response.data?.deleted_count || 0;
      return response.data;
    } catch (error) {
      console.error('❌ [notificationService] Error eliminando notificaciones leídas:', error);
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
      console.error('❌ [notificationService] Error obteniendo preferencias:', error);
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
      console.error('❌ [notificationService] Error actualizando preferencias:', error);
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
      console.error('❌ [notificationService] Error actualizando preferencias (PATCH):', error);
      throw error;
    }
  },

  // ========================================
  // NUEVOS MÉTODOS PARA EL SISTEMA DE RECORDATORIOS
  // ========================================

  /**
   * Obtiene notificaciones de recordatorios específicamente
   */
  async getReminderNotifications(limit = 20) {
    try {
      const response = await notificationsApi.get('/notifications/', {
        params: { 
          type: 'shift_reminder',
          limit,
          ordering: '-created_at'
        }
      });
      
      const reminders = response.data?.notifications || response.data?.results || [];
      
      return {
        ...response.data,
        reminders: reminders.filter(n => n.type === 'shift_reminder')
      };
    } catch (error) {
      console.error('❌ [notificationService] Error obteniendo notificaciones de recordatorios:', error);
      throw error;
    }
  },

  /**
   * Obtiene notificaciones recientes de recordatorios (últimas 24 horas)
   */
  async getRecentReminders(hours = 24) {
    try {
      
      // Obtener todas las notificaciones y filtrar por fecha
      const allNotifications = await this.getNotifications({ limit: 100 });
      const notifications = allNotifications.notifications || allNotifications.results || [];
      
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hours);
      
      const recentReminders = notifications.filter(notification => {
        if (notification.type !== 'shift_reminder') return false;
        
        const notificationTime = new Date(notification.created_at);
        return notificationTime >= cutoffTime;
      });
      
      return recentReminders;
    } catch (error) {
      console.error('❌ [notificationService] Error obteniendo recordatorios recientes:', error);
      return [];
    }
  },

  /**
   * Filtra notificaciones por tipo
   */
  async getNotificationsByType(type, limit = 20) {
    try {
      const response = await notificationsApi.get('/notifications/', {
        params: { 
          type,
          limit,
          ordering: '-created_at'
        }
      });
      
      const filtered = response.data?.notifications || response.data?.results || [];
      
      return {
        ...response.data,
        [type]: filtered
      };
    } catch (error) {
      console.error(`❌ [notificationService] Error obteniendo notificaciones de tipo ${type}:`, error);
      throw error;
    }
  },

  /**
   * Obtiene estadísticas detalladas de notificaciones
   */
  async getNotificationStats() {
    try {
      const allNotifications = await this.getNotifications({ limit: 1000 });
      const notifications = allNotifications.notifications || allNotifications.results || [];
      
      const stats = {
        total: notifications.length,
        unread: notifications.filter(n => !n.is_read).length,
        read: notifications.filter(n => n.is_read).length,
        by_type: {},
        by_icon: {},
        recent_activity: [],
        reminder_stats: {
          total: 0,
          recent_24h: 0,
          unread: 0
        }
      };

      // Procesar cada notificación
      notifications.forEach(notification => {
        const type = notification.type || 'unknown';
        const icon = notification.icon || 'info';
        
        // Contar por tipo
        stats.by_type[type] = (stats.by_type[type] || 0) + 1;
        
        // Contar por icono
        stats.by_icon[icon] = (stats.by_icon[icon] || 0) + 1;
        
        // Estadísticas específicas de recordatorios
        if (type === 'shift_reminder') {
          stats.reminder_stats.total++;
          if (!notification.is_read) stats.reminder_stats.unread++;
          
          // Verificar si es reciente (últimas 24h)
          const notificationTime = new Date(notification.created_at);
          const dayAgo = new Date();
          dayAgo.setHours(dayAgo.getHours() - 24);
          if (notificationTime >= dayAgo) {
            stats.reminder_stats.recent_24h++;
          }
        }
      });

      // Actividad reciente (últimas 5 notificaciones)
      stats.recent_activity = notifications
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          time: n.created_at,
          is_read: n.is_read
        }));

      return stats;
    } catch (error) {
      console.error('❌ [notificationService] Error obteniendo estadísticas de notificaciones:', error);
      return {
        total: 0,
        unread: 0,
        read: 0,
        by_type: {},
        by_icon: {},
        recent_activity: [],
        reminder_stats: {
          total: 0,
          recent_24h: 0,
          unread: 0
        }
      };
    }
  },

  /**
   * Obtiene el resumen de recordatorios para mostrar en dashboard
   */
  async getRemindersSummary() {
    try {
      
      const stats = await this.getNotificationStats();
      const recentReminders = await this.getRecentReminders(24);
      
      const summary = {
        total_reminders: stats.reminder_stats.total,
        recent_reminders: stats.reminder_stats.recent_24h,
        unread_reminders: stats.reminder_stats.unread,
        next_reminder: this.findNextReminder(recentReminders),
        reminder_coverage: this.calculateReminderCoverage(recentReminders)
      };
      
      return summary;
    } catch (error) {
      console.error('❌ [notificationService] Error obteniendo resumen de recordatorios:', error);
      return {
        total_reminders: 0,
        recent_reminders: 0,
        unread_reminders: 0,
        next_reminder: null,
        reminder_coverage: '0%'
      };
    }
  },

  /**
   * Encuentra el próximo recordatorio programado
   */
  findNextReminder(reminders) {
    if (!reminders || reminders.length === 0) return null;
    
    const futureReminders = reminders.filter(reminder => {
      // Buscar en el mensaje la hora del turno
      const message = reminder.message || '';
      const timeMatch = message.match(/(\d{1,2}:\d{2})/);
      if (!timeMatch) return false;
      
      const reminderTime = new Date(reminder.created_at);
      const now = new Date();
      return reminderTime > now;
    });
    
    if (futureReminders.length === 0) return null;
    
    // Ordenar por fecha más próxima
    futureReminders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    return {
      id: futureReminders[0].id,
      time: futureReminders[0].created_at,
      message: futureReminders[0].message,
      title: futureReminders[0].title
    };
  },

  /**
   * Calcula la cobertura de recordatorios (qué porcentaje de turnos tienen recordatorios)
   */
  calculateReminderCoverage(reminders) {
    if (!reminders || reminders.length === 0) return '0%';
    
    // Agrupar por día para estimar cobertura
    const daysWithReminders = new Set();
    reminders.forEach(reminder => {
      const date = new Date(reminder.created_at).toDateString();
      daysWithReminders.add(date);
    });
    
    const coverage = (daysWithReminders.size / 7) * 100; // Asumiendo una semana
    return `${Math.min(100, Math.round(coverage))}%`;
  },

  /**
   * Verifica la salud del sistema de notificaciones
   */
  async checkSystemHealth() {
    try {
      
      const [stats, preferences, unreadCount] = await Promise.all([
        this.getNotificationStats(),
        this.getPreferences(),
        this.getUnreadCount()
      ]);
      
      const health = {
        status: 'healthy',
        issues: [],
        recommendations: [],
        stats: {
          total_notifications: stats.total,
          unread_notifications: unreadCount,
          reminder_coverage: stats.reminder_stats.total > 0 ? 'good' : 'none',
          preferences_configured: !!preferences
        }
      };
      
      // Detectar problemas
      if (stats.total === 0) {
        health.issues.push('No hay notificaciones en el sistema');
        health.recommendations.push('Verificar que el sistema esté generando notificaciones correctamente');
      }
      
      if (stats.reminder_stats.total === 0) {
        health.issues.push('No se detectaron recordatorios de turnos');
        health.recommendations.push('Verificar que los turnos estén programando recordatorios automáticamente');
      }
      
      if (unreadCount > 50) {
        health.status = 'warning';
        health.issues.push('Muchas notificaciones no leídas');
        health.recommendations.push('Considerar marcar todas como leídas');
      }
      
      if (!preferences) {
        health.status = 'warning';
        health.issues.push('Preferencias de notificación no configuradas');
        health.recommendations.push('Configurar preferencias de notificación');
      }
      
      return health;
    } catch (error) {
      console.error('❌ [notificationService] Error verificando salud del sistema:', error);
      return {
        status: 'error',
        issues: ['Error al verificar la salud del sistema'],
        recommendations: ['Revisar la conexión con el servidor'],
        stats: {}
      };
    }
  }
};

export default notificationService;
