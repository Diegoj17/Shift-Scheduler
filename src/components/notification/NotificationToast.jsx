import React, { useEffect } from 'react';
import { 
  FaCheckCircle, 
  FaExclamationCircle, 
  FaInfoCircle, 
  FaTimes,
  FaCalendarAlt,
  FaClock
} from 'react-icons/fa';
import '../../styles/components/notification/NotificationToast.css';

const ICON_MAP = {
  success: FaCheckCircle,
  warning: FaExclamationCircle,
  info: FaInfoCircle,
  error: FaExclamationCircle,
  shift_assigned: FaCalendarAlt,
  shift_modified: FaExclamationCircle,
  shift_cancelled: FaExclamationCircle,
  shift_reminder: FaClock,
  request_created: FaExclamationCircle,
  request_approved: FaCheckCircle,
  request_rejected: FaExclamationCircle
};

const NotificationToast = ({ notification, onClose, autoHide = true, duration = 5000 }) => {
  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, onClose]);

  const getIcon = () => {
    const IconComponent = ICON_MAP[notification.type] || FaInfoCircle;
    return <IconComponent className={`toast-icon ${notification.type}`} />;
  };

  const getTitle = () => {
    if (notification.title) return notification.title;
    
    const titleMap = {
      shift_assigned: '📅 Nuevo Turno',
      shift_modified: '⚠️ Turno Modificado',
      shift_cancelled: '❌ Turno Cancelado',
      shift_reminder: '⏰ Recordatorio',
      request_created: '🆕 Nueva Solicitud',
      request_approved: '✅ Solicitud Aprobada',
      request_rejected: '❌ Solicitud Rechazada'
    };
    
    return titleMap[notification.type] || 'Nueva Notificación';
  };

  return (
    <div className={`notification-toast ${notification.type} show`}>
      <div className="toast-content">
        <div className="toast-icon-container">
          {getIcon()}
        </div>
        <div className="toast-text">
          <h4>{getTitle()}</h4>
          <p>{notification.message || 'Tienes una nueva notificación'}</p>
        </div>
        <button className="toast-close" onClick={onClose}>
          <FaTimes />
        </button>
      </div>
      {autoHide && <div className="toast-progress" style={{ animationDuration: `${duration}ms` }} />}
    </div>
  );
};

export default NotificationToast;