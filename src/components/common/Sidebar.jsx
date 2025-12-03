// Sidebar.jsx
import React from 'react';
import {
  FaThLarge,
  FaCalendarAlt,
  FaClipboardList,
  FaUserCheck,
  FaFileAlt,
  FaUsers,
  FaChartBar,
  FaSignOutAlt,
  FaChevronLeft,
  FaChevronRight,
  FaCog,
  FaListAlt,
  FaUserClock 
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import '../../styles/components/common/Sidebar.css';

const Sidebar = ({ isOpen, onToggle, activeItem, onItemClick, darkMode, menuItems: menuItemsProp }) => {
  const navigate = useNavigate();
  const defaultMenuItems = [
    { id: 'dashboard', label: 'Inicio', icon: <FaThLarge />, path: '/admin/dashboard' },
    { id: 'calendario', label: 'Calendario', icon: <FaCalendarAlt />, path: '/admin/calendar' },
    { id: 'disponibilidad', label: 'Disponibilidad', icon: <FaUserClock  />, path: '/admin/availability' },
    { id: 'solicitudes', label: 'Solicitudes', icon: <FaClipboardList  />, path: '/admin/shift-change-review' },
    { id: 'equipo', label: 'Equipo', icon: <FaUsers />, path: '/admin/management' },
    { id: 'informes', label: 'Informes', icon: <FaChartBar />, path: '/admin/reports' },
    // Nota: 'Configuración' removido de la lista por defecto para evitar que
    // aparezca en páginas donde no se desee. Añádelo explícitamente al pasar
    // `menuItems` si se necesita.
  ];

  // Si se pasan menuItems por props (como en SidebarEmployee), úsalos; si no, usa los por defecto
  const items = Array.isArray(menuItemsProp) && menuItemsProp.length > 0 ? menuItemsProp : defaultMenuItems;

  // Mapeo simple de cadenas a iconos para compatibilidad con menuItems que usan nombres
  const iconMap = {
    dashboard: <FaThLarge />,
    calendar: <FaCalendarAlt />,
    calendarPage: <FaCalendarAlt />,
    // inglés
    availability: <FaUserClock  />,
    requests: <FaClipboardList />,
    presence: <FaUserCheck />,
    documents: <FaFileAlt />,
    team: <FaUsers />,
    reports: <FaChartBar />,
    shiftTypeManager: <FaUsers />,
    // español (sinónimos)
    disponibilidad: <FaUserClock />,
    solicitudes: <FaClipboardList />,
    presencia: <FaUserCheck />,
    documentos: <FaFileAlt />,
    equipo: <FaUsers />,
    informes: <FaChartBar />,
    configuracion: <FaCog />,
  };

  // Mapeo por defecto de id -> path para items que no incluyan `path`
  const defaultPathMap = {
    dashboard: '/admin/dashboard',
    calendario: '/admin/calendar',
    disponibilidad: '/admin/availability',
    solicitudes: '/admin/shift-change-review',
    presencia: '/admin/attendance',
    documentos: '/admin/documents',
    equipo: '/admin/management',
    informes: '/admin/reports',
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleLogout = () => {
    navigate('/login');
  };

  const sidebarClass = `sidebar ${isOpen ? 'open' : 'collapsed'} ${darkMode ? 'dark' : 'light'}`;

  return (
    <div className={sidebarClass}>
      <div className="sidebar-header">
        <div className="logo-container" onClick={() => onToggle && onToggle()}>
          <div className="sidebar-logo">
            <img src="/img/calendario.png" alt="Shift Scheduler" className="sidebar-logo-img" />
          </div>
          {isOpen && (
            <div className="logo-text">
              <h2>Shift Scheduler</h2>
            </div>
          )}
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <button
                className={`nav-item ${activeItem === item.id ? 'active' : ''}`}
                onClick={() => {
                  onItemClick && onItemClick(item.id);
                  const path = item.path || defaultPathMap[item.id] || '/';
                  handleNavigation(path);
                }}
                data-tooltip={!isOpen ? item.label : ''}
              >
                <span className="nav-icon">
                  {(() => {
                    const icon = item.icon;
                    if (React.isValidElement(icon)) return icon;
                    if (typeof icon === 'string') return iconMap[icon] || null;
                    if (typeof icon === 'function') {
                      const IconComp = icon;
                      return <IconComp />;
                    }
                    return null;
                  })()}
                </span>
                {isOpen && <span className="nav-label">{item.label}</span>}
                {activeItem === item.id && <div className="active-indicator"></div>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <span className="nav-icon"><FaSignOutAlt /></span>
          {isOpen && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;