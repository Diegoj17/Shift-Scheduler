import React from 'react';
import { 
  FaTimes, 
  FaExclamationCircle, 
  FaCheckCircle, 
  FaInfoCircle,
  FaCalendarAlt,
  FaClock
} from 'react-icons/fa';
import '../../styles/components/notification/NotificationMenu.css';

const ICON_MAP = {
  warning: FaExclamationCircle,
  success: FaCheckCircle,
  info: FaInfoCircle,
  calendar: FaCalendarAlt,
  clock: FaClock
};

const NotificationMenu = ({ notifications = [], onMarkAsRead = () => {}, onMarkAllRead = () => {}, onClose = () => {} }) => {
  const unreadCount = notifications.filter(n => n.unread).length;

  const getNotificationIcon = (notification) => {
    const IconComponent = ICON_MAP[notification.type] || FaInfoCircle;
    const iconProps = {
      className: `notification-type-icon ${notification.type}`
    };
    return <IconComponent {...iconProps} />;
  };

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
              onClick={onMarkAllRead}
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
              className={`notification-item ${notification.unread ? 'unread' : ''}`}
              onClick={() => notification.unread && onMarkAsRead(notification.id)}
            >
              <div className="notification-icon">
                {getNotificationIcon(notification)}
              </div>
              <div className="notification-content">
                <h4>{notification.title}</h4>
                <p>{notification.message}</p>
                <span className="notification-time">{notification.time}</span>
              </div>
              {notification.unread && (
                <div className="unread-dot"></div>
              )}
            </div>
          ))
        ) : (
          <div className="no-notifications">
            <FaInfoCircle className="no-notifications-icon" />
            <p>No hay notificaciones</p>
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