// SidebarEmployee.jsx
import React from 'react';
import {
  FaThLarge,
  FaCalendarAlt,
  FaClock,
  FaExchangeAlt,
  FaClipboardCheck,
  FaFileAlt,
  FaExclamationTriangle,
  FaSignOutAlt,
  FaCog
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import '../../../styles/components/common/Sidebar.css';
import defaultMenuItems from './sidebarMenu';

const SidebarEmployee = ({ isOpen, onToggle, activeItem, onItemClick, darkMode, menuItems }) => {
  const navigate = useNavigate();

  // Usar los menuItems pasados por props si existen, si no usar los por defecto importados
  const items = Array.isArray(menuItems) && menuItems.length > 0 ? menuItems : defaultMenuItems;

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
                  onItemClick(item.id);
                  handleNavigation(item.path);
                }}
                data-tooltip={!isOpen ? item.label : ''}
              >
                <span className="nav-icon">{item.icon ? (function IconWrapper(){ const Icon = item.icon; return <Icon />; })() : null}</span>
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

export default SidebarEmployee;