import React from 'react';
import '../../../styles/components/calendar/user/ShiftDetails.css';
import { FiX, FiSun, FiMoon, FiClock } from 'react-icons/fi';

const ShiftDetails = ({ shift, isOpen, onClose }) => {
  if (!isOpen || !shift) return null;

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getShiftTypeColor = (type) => {
    // Use CSS variables defined in ShiftCalendar.css to centralize color management
    const vars = {
      morning: 'var(--shift-type-morning, #4CAF50)',
      afternoon: 'var(--shift-type-afternoon, #FF9800)',
      night: 'var(--shift-type-night, #2196F3)'
    };
    return vars[type] || 'var(--shift-text-muted, #757575)';
  };

  // Provide a header/theme gradient per shift type so the modal header updates dynamically
  const getThemeForType = (type) => {
    const themes = {
      morning: { primary: '#2db14a', dark: '#228b3a',  icon: '☀️'  }, // verde
      afternoon: { primary: '#ffb74d', dark: '#f57c00', icon: '⛅' }, // naranja
      night: { primary: '#4f8cff', dark: '#3358e6', icon: '🌙' } // azul (por defecto)
    };
    return themes[type] || themes['night'];
  };

  const theme = getThemeForType(shift.type);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="shift-details"
        onClick={(e) => e.stopPropagation()}
        style={{
          '--shift-primary': theme.primary,
          '--shift-primary-dark': theme.dark
        }}
      >
        <button className="close-btn" onClick={onClose} aria-label="Cerrar">
          <FiX size={20} aria-hidden="true" />
        </button>
        
        <div className="details-header">
          <div
            className="shift-type-indicator"
            style={{ backgroundColor: getShiftTypeColor(shift.type) }}
          >
            {/* Icono por tipo de turno */}
            {shift.type === 'morning' && <FiSun className="type-icon" size={16} aria-hidden="true" />}
            {shift.type === 'afternoon' && <FiClock className="type-icon" size={16} aria-hidden="true" />}
            {shift.type === 'night' && <FiMoon className="type-icon" size={16} aria-hidden="true" />}
          </div>
          <h2>Detalles del Turno</h2>
        </div>
        
        <div className="details-content">
          <div className="detail-row">
            <span className="label">Fecha:</span>
            <span className="value">{formatDate(shift.start)}</span>
          </div>
          
          <div className="detail-row">
            <span className="label">Horario:</span>
            <span className="value">
              {formatTime(shift.start)} - {formatTime(shift.end)}
            </span>
          </div>
          
          <div className="detail-row">
            <span className="label">Duración:</span>
            <span className="value">
              {Math.round((new Date(shift.end) - new Date(shift.start)) / (1000 * 60 * 60))} horas
            </span>
          </div>
          
          <div className="detail-row">
            <span className="label">Rol:</span>
            <span className="value role-badge">{shift.role}</span>
          </div>
          
          <div className="detail-row">
            <span className="label">Ubicación:</span>
            <span className="value">{shift.location}</span>
          </div>
          
          <div className="detail-row">
            <span className="label">Tipo de Turno:</span>
            <span className="value">
              <span 
                className="type-badge"
                style={{ 
                  backgroundColor: getShiftTypeColor(shift.type),
                  color: 'white'
                }}
              >
                {shift.type === 'morning' && 'Mañana'}
                {shift.type === 'afternoon' && 'Tarde'}
                {shift.type === 'night' && 'Noche'}
              </span>
            </span>
          </div>
        </div>
        
        <div className="details-actions">
          <button className="action-btn primary">Exportar a Calendario</button>
          <button className="action-btn secondary">Solicitar Cambio</button>
        </div>
      </div>
    </div>
  );
};

export default ShiftDetails;