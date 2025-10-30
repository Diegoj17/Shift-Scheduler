import React from 'react';
import { FaCalendarAlt, FaUsers, FaCog, FaSignOutAlt } from 'react-icons/fa';
import '../../styles/components/common/Sidebar.css';

const Sidebar = ({ collapsed = false }) => {
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="sidebar-logo-img" aria-hidden="true"></div>
          <div className="logo-text">
            <h2>Shift</h2>
            <span>Scheduler</span>
          </div>
        </div>
        <button className="sidebar-toggle" aria-label="Toggle sidebar">
          {/* Icon handled in Header trigger; placeholder button for spacing */}
        </button>
      </div>

      <nav className="sidebar-nav">
        <ul>
          <li>
            <a className="nav-item active" href="#/calendar" data-tooltip="Calendario">
              <span className="nav-icon"><FaCalendarAlt /></span>
              <span className="nav-label">Calendario</span>
              <span className="active-indicator" />
            </a>
          </li>
          <li>
            <a className="nav-item" href="#/users" data-tooltip="Empleados">
              <span className="nav-icon"><FaUsers /></span>
              <span className="nav-label">Empleados</span>
            </a>
          </li>
          <li>
            <a className="nav-item" href="#/settings" data-tooltip="Ajustes">
              <span className="nav-icon"><FaCog /></span>
              <span className="nav-label">Ajustes</span>
            </a>
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn">
          <span className="nav-icon"><FaSignOutAlt /></span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
