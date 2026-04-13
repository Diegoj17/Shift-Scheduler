// src/hooks/useNotificationToasts.js - VERSIÓN CORREGIDA
import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useNotificationToasts = () => {
  const [toasts, setToasts] = useState([]);
  const { user: currentUser } = useAuth();

  // ✅ Filtrar toasts por rol - CORREGIDO
  const shouldShowToast = useCallback((notification) => {
    if (!currentUser) return false;
    
    const userRole = currentUser.role?.toLowerCase();
    const notificationType = notification.type;
    
    // 👨‍💼 Admin/Gerente: TODAS las notificaciones de solicitudes
    if (userRole === 'admin' || userRole === 'gerente' || userRole === 'manager') {
      return [
        'request_created',
        'request_approved',
        'request_rejected',
        'request_cancelled'
      ].includes(notificationType);
    }

    // 👷 Empleado: Notificaciones de turnos y respuestas
    return [
      'shift_assigned',
      'shift_modified', 
      'shift_cancelled',
      'shift_reminder',
      'request_approved',  
      'request_rejected',
      'request_cancelled'
    ].includes(notificationType);
    
  }, [currentUser]);

  const showToast = useCallback((notification) => {
    // ✅ Verificar si debe mostrarse según el rol
    if (!shouldShowToast(notification)) {
      return null;
    }

    const toastId = Date.now().toString();
    
    const newToast = {
      id: toastId,
      ...notification,
      timestamp: Date.now()
    };

    setToasts(prev => [...prev, newToast].slice(0, 3)); // Máximo 3 toasts
    
    return toastId;
  }, [shouldShowToast, currentUser]);

  const hideToast = useCallback((toastId) => {
    setToasts(prev => prev.filter(toast => toast.id !== toastId));
  }, []);

  const hideAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    showToast,
    hideToast,
    hideAllToasts
  };
};
