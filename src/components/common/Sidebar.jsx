// Sidebar.jsx
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
  FaCog
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import '../../styles/components/common/Sidebar.css';

const Sidebar = ({ isOpen, onToggle, activeItem, onItemClick, darkMode, menuItems: menuItemsProp }) => {
  const navigate = useNavigate();
  const defaultMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaThLarge />, path: '/admin/dashboard' },
    { id: 'calendario', label: 'Calendario', icon: <FaCalendarAlt />, path: '/admin/calendar-page' },
    { id: 'solicitudes', label: 'Solicitudes', icon: <FaClipboardList />, path: '/admin/requests' },
    { id: 'presencia', label: 'Presencia', icon: <FaUserCheck />, path: '/admin/attendance' },
    { id: 'documentos', label: 'Documentos', icon: <FaFileAlt />, path: '/admin/documents' },
    { id: 'equipo', label: 'Equipo', icon: <FaUsers />, path: '/admin/management' },
    { id: 'informes', label: 'Informes', icon: <FaChartBar />, path: '/reports' },
    { id: 'configuracion', label: 'Configuración', icon: <FaCog />, path: '/settings' },
  ];

  // Si se pasan menuItems por props (como en SidebarEmployee), úsalos; si no, usa los por defecto
  const items = Array.isArray(menuItemsProp) && menuItemsProp.length > 0 ? menuItemsProp : defaultMenuItems;

  // Mapeo simple de cadenas a iconos para compatibilidad con menuItems que usan nombres
  const iconMap = {
    dashboard: <FaThLarge />,
    calendar: <FaCalendarAlt />,
    calendarPage: <FaCalendarAlt />,
    requests: <FaClipboardList />,
    presence: <FaUserCheck />,
    documents: <FaFileAlt />,
    team: <FaUsers />,
    reports: <FaChartBar />,
    settings: <FaCog />,
  };

  // Mapeo por defecto de id -> path para items que no incluyan `path`
  const defaultPathMap = {
    dashboard: '/admin/dashboard',
    calendario: '/calendar-page',
    solicitudes: '/requests',
    presencia: '/attendance',
    documentos: '/documents',
    equipo: '/admin/management',
    informes: '/reports',
    configuracion: '/settings'
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
                  {
                    // Si item.icon ya es un elemento React
                    item.icon && item.icon.$$typeof ? item.icon
                    // Si es un string, intentar mapearlo
                    : (typeof item.icon === 'string' ? (iconMap[item.icon] || null)
                    // Si es una función/componente, renderizar
                    : (typeof item.icon === 'function' ? (function IconWrapper(){ const Icon = item.icon; return <Icon />; })() : null))
                  }
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