import React, { useState, useRef, useEffect } from 'react';
import { FaBars, FaBell } from 'react-icons/fa';
import ProfileMenu from '../profile/ProfileMenu';
import NotificationMenu from '../notification/NotificationMenu';
import '../../styles/components/common/Header.css';

const Header = ({ onToggleSidebar, pageTitle = 'Dashboard' }) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'warning',
      title: 'Turno Pendiente',
      message: 'Tienes un turno por confirmar para mañana',
      time: 'Hace 5 min',
      iconName: 'warning',
      unread: true
    },
    {
      id: 2,
      type: 'success',
      title: 'Solicitud Aprobada',
      message: 'Tu solicitud de vacaciones ha sido aprobada',
      time: 'Hace 1 hora',
      iconName: 'success',
      unread: true
    },
    {
      id: 3,
      type: 'info',
      title: 'Nuevo Horario',
      message: 'Se ha publicado el horario de la próxima semana',
      time: 'Hace 2 horas',
      iconName: 'calendar',
      unread: false
    },
    {
      id: 4,
      type: 'info',
      title: 'Recordatorio',
      message: 'Reunión de equipo a las 10:00 AM',
      time: 'Hace 1 día',
      iconName: 'clock',
      unread: false
    }
  ]);

  const markAsRead = (notificationId) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, unread: false } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const unreadCount = notifications.filter(n => n.unread).length;

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

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
  };

  // Profile menu is handled by the ProfileMenu component itself (it provides its own trigger and outside-click handling)


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
            className={`notification-trigger ${notificationsOpen ? 'active' : ''}`}
            onClick={toggleNotifications}
          >
            <FaBell className="react-icon notification-icon" />
            <span className="notification-badge">{unreadCount}</span>
          </button>

          {notificationsOpen && (
            <NotificationMenu
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onMarkAllRead={markAllAsRead}
              onClose={() => setNotificationsOpen(false)}
            />
          )}
        </div>

        {/* Menú de Perfil */}
        {/* ProfileMenu renders its own trigger and dropdown */}
        <ProfileMenu />
      </div>
    </header>
  );
};

export default Header;