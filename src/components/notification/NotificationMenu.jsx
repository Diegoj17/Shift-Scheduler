import React from 'react';
import { 
  FaTimes, 
  FaExclamationCircle, 
  FaCheckCircle, 
  FaInfoCircle,
  FaCalendarAlt,
  FaClock,
  FaTrash,
  FaSync
} from 'react-icons/fa';
import '../../styles/components/notification/NotificationMenu.css';

const ICON_MAP = {
  // Tipos genéricos
  warning: FaExclamationCircle,
  success: FaCheckCircle,
  info: FaInfoCircle,
  calendar: FaCalendarAlt,
  clock: FaClock,
  
  // Tipos específicos del backend
  shift_assigned: FaCalendarAlt,
  shift_modified: FaExclamationCircle,
  shift_cancelled: FaExclamationCircle,
  shift_reminder: FaClock,
  request_created: FaExclamationCircle,
  request_approved: FaCheckCircle,
  request_rejected: FaExclamationCircle
};

const NotificationMenu = ({ 
  notifications = [], 
  onMarkAsRead = () => {}, 
  onMarkAllRead = () => {}, 
  onDeleteNotification = () => {},
  onClose = () => {} 
}) => {
  // Calcular unreadCount basado en is_read del backend
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Función para formatear el tiempo
  const formatTime = (dateString) => {
    if (!dateString) return 'Reciente';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Ahora mismo';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffHours < 24) return `Hace ${diffHours} h`;
      if (diffDays === 1) return 'Ayer';
      if (diffDays < 7) return `Hace ${diffDays} días`;
      
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
      });
    } catch (error) {
      return 'Reciente';
    }
  };

  const getNotificationIcon = (notification) => {
    // Mapear tipos del backend a iconos
    let iconType = 'info';
    
    if (notification.type === 'shift_assigned') iconType = 'calendar';
    else if (notification.type === 'shift_modified') iconType = 'warning';
    else if (notification.type === 'shift_cancelled') iconType = 'warning';
    else if (notification.type === 'shift_reminder') iconType = 'clock';
    else if (notification.type === 'request_approved') iconType = 'success';
    else if (notification.type === 'request_rejected') iconType = 'warning';
    
    const IconComponent = ICON_MAP[iconType] || FaInfoCircle;
    
    return <IconComponent className={`notification-type-icon ${iconType}`} />;
  };

  const handleMarkAsRead = (notificationId, e) => {
    e?.stopPropagation();
    onMarkAsRead(notificationId);
  };

  const handleMarkAllRead = () => {
    onMarkAllRead();
  };

  const handleDeleteNotification = (notificationId, e) => {
    e?.stopPropagation();
    onDeleteNotification(notificationId);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
  };

  console.log('🔔 Notificaciones en el menú:', notifications);

  return (
    <div className="notification-menu">
      <div className="notification-header">
        <div className="notification-title">
          <h3>Notificaciones</h3>
          {unreadCount > 0 && (
            <span className="unread-count">{unreadCount}</span>
          )}
        </div>
        <div className="notification-actions">
          {unreadCount > 0 && (
            <button 
              className="mark-all-read"
              onClick={handleMarkAllRead}
            >
              Marcar todas como leídas
            </button>
          )}
          <button className="close-notifications" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
      </div>

      <div className="notification-list">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <div 
              key={notification.id} 
              // ✅ CORREGIDO: Agregar la clase del tipo de notificación
              className={`notification-item ${notification.type} ${!notification.is_read ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification)}
              </div>
              <div className="notification-content">
                <h4>{notification.title || 'Sin título'}</h4>
                <p>{notification.message || 'Sin mensaje'}</p>
                <span className="notification-time">
                  {formatTime(notification.created_at)}
                </span>
              </div>
              
              <div className="notification-actions-item">
                {!notification.is_read && (
                  <button
                    className="mark-read-btn"
                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                    title="Marcar como leída"
                  >
                    <FaCheckCircle />
                  </button>
                )}
                <button
                  className="delete-notification-btn"
                  onClick={(e) => handleDeleteNotification(notification.id, e)}
                  title="Eliminar notificación"
                >
                  <FaTrash />
                </button>
              </div>

              {!notification.is_read && (
                <div className="unread-dot" title="No leída"></div>
              )}
            </div>
          ))
        ) : (
          <div className="no-notifications">
            <FaInfoCircle className="no-notifications-icon" />
            <p>No hay notificaciones</p>
            <small>Todas las notificaciones aparecerán aquí</small>
          </div>
        )}
      </div>

      <div className="notification-footer">
        <button className="view-all-notifications">
          Ver todas las notificaciones
        </button>
      </div>
    </div>
  );
};

export default NotificationMenu;