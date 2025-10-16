import React from 'react';
import { FaCalendarAlt, FaBell } from 'react-icons/fa';
import '../../../../styles/components/dashboard/DashboardHeader.css';

const DashboardHeader = () => {
  // Obtener fecha actual
  const today = new Date();
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  const formattedDate = today.toLocaleDateString('es-ES', options);
  
  // Capitalizar primera letra
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className="welcome-header">
      <div className="header-content">
        <div className="header-text">
          <h2>Bienvenido al Sistema de Gestión de Turnos</h2>
          <p>Gestiona eficientemente los horarios y turnos de tu equipo</p>
        </div>
        
        <div className="header-info">
          <div className="info-card date-card">
            <FaCalendarAlt className="info-icon" />
            <div className="info-content">
              <span className="info-label">Fecha</span>
              <span className="info-value">{capitalizedDate}</span>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;