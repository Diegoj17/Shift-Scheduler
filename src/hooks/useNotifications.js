// src/hooks/useNotifications.js - VERSIÓN CORREGIDA
import { useState, useEffect, useCallback } from 'react';
import notificationService from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';

/**
 * Hook personalizado para manejar notificaciones
 * Filtra automáticamente por rol del usuario
 */
export const useNotifications = (autoRefresh = true, refreshInterval = 30000) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // ✅ Obtener el usuario actual y su rol
  const { user: currentUser } = useAuth();

  // Determinar qué tipos de notificación mostrar según el rol - CORREGIDO
  const getNotificationTypesByRole = useCallback(() => {
    if (!currentUser) return null;
    
    const userRole = currentUser.role?.toLowerCase();
    
    if (userRole === 'admin' || userRole === 'gerente' || userRole === 'manager') {
      // 👨‍💼 Admin/Gerente: TODAS las notificaciones relacionadas con solicitudes
      return [
        'request_created',    
        'request_approved', 
        'request_rejected',
        'request_cancelled'
      ];
    } else {
      // 👷 Empleado: Notificaciones de turnos y respuestas a sus solicitudes
      return [
        'shift_assigned', 
        'shift_modified', 
        'shift_cancelled', 
        'shift_reminder',
        'request_approved',  
        'request_rejected',
        'request_cancelled'
      ];
    }
  }, [currentUser]);

  // Cargar notificaciones FILTRADAS por rol
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener TODAS las notificaciones del usuario
      const data = await notificationService.getNotifications({ limit: 50 });
      // El backend puede devolver { notifications: [...] } o { results: [...] } o un arreglo plano
      const allNotifications = (data && (data.notifications || data.results))
        ? (data.notifications || data.results)
        : (Array.isArray(data) ? data : []);
      
      // ✅ FILTRAR por rol
      const allowedTypes = getNotificationTypesByRole();
      let filteredNotifications = allNotifications;
      
      if (allowedTypes) {
        filteredNotifications = allNotifications.filter(notification => 
          allowedTypes.includes(notification.type)
        );
        
      }
      
      setNotifications(filteredNotifications);
      
      // Calcular conteo de no leídas basado en las filtradas
      const filteredUnreadCount = filteredNotifications.filter(n => !n.is_read).length;
      setUnreadCount(filteredUnreadCount);
      
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser, getNotificationTypesByRole]);

  // Cargar solo el conteo de no leídas (más eficiente)
  const loadUnreadCount = useCallback(async () => {
    try {
      await notificationService.getUnreadCount();

      // Para el conteo en tiempo real, recargamos y aplicamos el filtro
      await loadNotifications();
      
    } catch (err) {
      console.error('Error obteniendo conteo:', err);
    }
  }, [loadNotifications]);

  // Implementaciones para manipular notificaciones
  const markAsRead = useCallback(async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => {
        const next = prev.map(n => (n.id === id || n._id === id ? { ...n, is_read: true } : n));
        // actualizar contador basado en la nueva lista
        setUnreadCount(next.filter(x => !x.is_read).length);
        return next;
      });
    } catch (err) {
      console.error('Error marcando notificación como leída:', err);
      setError(err?.message || String(err));
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marcando todas las notificaciones como leídas:', err);
      setError(err?.message || String(err));
    }
  }, []);

  const deleteNotification = useCallback(async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => {
        const next = prev.filter(n => !(n.id === id || n._id === id));
        setUnreadCount(next.filter(x => !x.is_read).length);
        return next;
      });
    } catch (err) {
      console.error('Error eliminando notificación:', err);
      setError(err?.message || String(err));
    }
  }, []);
  
  // Cargar notificaciones al montar el componente
  useEffect(() => {
    if (currentUser) {
      loadNotifications();
    }
  }, [loadNotifications, currentUser]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !currentUser) return;

    const intervalId = setInterval(() => {
      loadUnreadCount();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, loadUnreadCount, currentUser]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: loadNotifications
  };
};

export default useNotifications;
