import React from 'react';
import { FaRegCalendarAlt, FaClock } from 'react-icons/fa';
import '../../../../styles/components/dashboard/user/WelcomeCard.css';

const WelcomeCard = ({ employeeName, currentTime }) => {
  const firstName = employeeName.split(' ')[0];

  const formattedDate = currentTime.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="welcome-dashboard-container">
      <div className="welcome-top-row">
        <div className="welcome-greeting-section">
          <h2 className="welcome-title">¡Buenos días, {firstName}!</h2>
          <p className="welcome-subtitle">Aquí tienes un resumen de tu jornada de hoy</p>
        </div>

        <div className="welcome-datetime-display">
          <div className="info-card date-card">
            <div className="info-icon"><FaRegCalendarAlt /></div>
            <div className="info-content">
              <div className="info-label">Fecha</div>
              <div className="info-value">{formattedDate}</div>
            </div>
          </div>

          <div className="info-card time-card">
            <div className="info-icon"><FaClock /></div>
            <div className="info-content">
              <div className="info-label">Hora</div>
              <div className="info-value">{formattedTime}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Si se quiere agregar contenido debajo del saludo, iría aquí */}
    </div>
  );
};

export default WelcomeCard;