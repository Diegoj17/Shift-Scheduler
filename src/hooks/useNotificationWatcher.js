import { useEffect, useRef } from 'react';
import { useToast } from '../context/NotificationToastContext';
import useNotifications from './useNotifications';

export const useNotificationWatcher = (checkInterval = 15000) => {
  const { showToast } = useToast();
  const { notifications, refresh } = useNotifications();
  const lastNotificationId = useRef(null);

  useEffect(() => {
    // Establecer el último ID conocido al cargar
    if (notifications.length > 0 && !lastNotificationId.current) {
      lastNotificationId.current = notifications[0]?.id || null;
    }
  }, [notifications]);

  useEffect(() => {
    const checkForNewNotifications = () => {
      if (notifications.length > 0) {
        const latestNotification = notifications[0];
        
        // Si encontramos una notificación nueva y no leída
        if (latestNotification.id !== lastNotificationId.current && !latestNotification.is_read) {
          console.log('🔔 Nueva notificación detectada:', {
            id: latestNotification.id,
            type: latestNotification.type,
            title: latestNotification.title
          });
          
          // ✅ showToast ya filtra por rol automáticamente
          showToast({
            type: latestNotification.type,
            title: latestNotification.title,
            message: latestNotification.message
          });
          
          // Actualizar referencia
          lastNotificationId.current = latestNotification.id;
        }
      }
    };

    // Verificar inmediatamente
    checkForNewNotifications();

    // Configurar intervalo para verificar nuevas notificaciones
    const interval = setInterval(() => {
      refresh(); // Actualizar notificaciones
      setTimeout(checkForNewNotifications, 1000); // Esperar a que se carguen
    }, checkInterval);

    return () => clearInterval(interval);
  }, [notifications, refresh, showToast, checkInterval]);
};