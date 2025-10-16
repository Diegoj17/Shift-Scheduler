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
import { useNavigate, useLocation } from "react-router-dom";
import '../../styles/components/common/Sidebar.css';

const Sidebar = ({ isOpen, onToggle, activeItem, onItemClick, darkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaThLarge />, path: '/dashboard' },
    { id: 'calendario', label: 'Calendario', icon: <FaCalendarAlt />, path: '/calendar-page' },
    { id: 'solicitudes', label: 'Solicitudes', icon: <FaClipboardList />, path: '/requests' },
    { id: 'presencia', label: 'Presencia', icon: <FaUserCheck />, path: '/attendance' },
    { id: 'documentos', label: 'Documentos', icon: <FaFileAlt />, path: '/documents' },
    { id: 'equipo', label: 'Equipo', icon: <FaUsers />, path: '/management' },
    { id: 'informes', label: 'Informes', icon: <FaChartBar />, path: '/reports' },
    { id: 'configuracion', label: 'Configuración', icon: <FaCog />, path: '/settings' },
  ];

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
        <div className="logo-container">
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
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                className={`nav-item ${activeItem === item.id ? 'active' : ''}`}
                onClick={() => {
                  onItemClick(item.id);
                  handleNavigation(item.path);
                }}
                data-tooltip={!isOpen ? item.label : ''}
              >
                <span className="nav-icon">{item.icon}</span>
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