import React, { useState, useRef, useEffect } from 'react';
import { FaBars, FaBell } from 'react-icons/fa';
import ProfileMenu from '../profile/ProfileMenu';
import NotificationMenu from '../notification/NotificationMenu';
import useNotifications from '../../hooks/useNotifications';
import '../../styles/components/common/Header.css';

const Header = ({ onToggleSidebar, pageTitle = 'Dashboard' }) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);
  
  // ✅ Hook personalizado para notificaciones reales con auto-refresh cada 30s
  const { 
    notifications,
    unreadCount, 
    loadNotifications,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications(true, 30000);

  // Cerrar menú de notificaciones al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleNotifications = async () => {
    const newState = !notificationsOpen;
    setNotificationsOpen(newState);
    
    // Recargar notificaciones al abrir el menú
    if (newState) {
      try {
        await refresh();
        console.log('🔔 Notificaciones actualizadas al abrir menú:', notifications.length);
      } catch (error) {
        console.error('Error cargando notificaciones:', error);
      }
    }
  };

  const handleCloseNotifications = () => {
    setNotificationsOpen(false);
  };

  return (
    <header className="main-header">
      <div className="header-left">
        <button className="mobile-toggle" onClick={onToggleSidebar}>
          <FaBars className="react-icon" />
        </button>

        <div className="page-info">
          <h1 className="page-title">{pageTitle}</h1>
        </div>
      </div>

      <div className="header-right">
        {/* Menú de Notificaciones */}
        <div className="notification-container" ref={notificationsRef}>
          <button 
            className={`notification-trigger ${notificationsOpen ? 'active' : ''} ${unreadCount > 0 ? 'has-notifications' : ''}`}
            onClick={toggleNotifications}
            title={unreadCount > 0 ? `${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} sin leer` : 'Notificaciones'}
          >
            <FaBell className="react-icon notification-icon" />
            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <NotificationMenu
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onMarkAllRead={markAllAsRead}
              onDeleteNotification={deleteNotification}
              onClose={handleCloseNotifications}
            />
          )}
        </div>

        {/* Menú de Perfil */}
        <ProfileMenu />
      </div>
    </header>
  );
};

export default Header;