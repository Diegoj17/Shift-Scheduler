import { FaTimes, FaSun, FaClock, FaCalendarDay, FaMapMarkerAlt, FaBuilding, FaCheckCircle, FaDownload, FaExchangeAlt } from 'react-icons/fa';
import { FiSun, FiClock, FiMoon} from 'react-icons/fi';
import '../../../styles/components/calendar/user/ShiftDetails.css';

const ShiftDetails = ({ shift, isOpen, onClose, onExport }) => {
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
    const colors = {
      morning: '#4CAF50',
      afternoon: '#FF9800',
      night: '#2196F3'
    };
    return colors[type] || '#757575';
  };

  const getThemeForType = (type) => {
    const themes = {
      morning: { primary: '#4CAF50', dark: '#388E3C', icon: <FiSun />, label: 'Mañana' },
      afternoon: { primary: '#FF9800', dark: '#F57C00', icon: <FiClock />, label: 'Tarde' },
      night: { primary: '#2196F3', dark: '#1976D2', icon: <FiMoon />, label: 'Noche' }
    };
    return themes[type] || themes['night'];
  };

  const theme = getThemeForType(shift.type);
  const duration = Math.round((new Date(shift.end) - new Date(shift.start)) / (1000 * 60 * 60));

  return (
    <div className="shift-modal-overlay" onClick={onClose}>
      <div
        className="shift-details"
        onClick={(e) => e.stopPropagation()}
        style={{
          '--shift-primary': theme.primary,
          '--shift-primary-dark': theme.dark
        }}
      >
        <button className="shift-close-btn" onClick={onClose} aria-label="Cerrar">
          <FaTimes aria-hidden="true" />
        </button>
        
        <div className="shift-details-header">
          <div
            className="shift-type-indicator"
            style={{ backgroundColor: getShiftTypeColor(shift.type) }}
          >
            {theme.icon}
          </div>
          <div className="shift-header-content">
            <h2>Detalles del Turno</h2>
            <p className="shift-header-subtitle">{shift.role} • {shift.department}</p>
          </div>
        </div>
        
        <div className="shift-details-content">
          <div className="shift-detail-section">
            <h4 className="shift-section-title">
              <FaCalendarDay className="shift-section-icon" aria-hidden="true" />
              Información de Horario
            </h4>
            <div className="shift-detail-grid">
              <div className="shift-detail-row">
                <span className="shift-label">Fecha:</span>
                <span className="shift-value">{formatDate(shift.start)}</span>
              </div>
              
              <div className="shift-detail-row">
                <span className="shift-label">Horario:</span>
                <span className="shift-value shift-time-value">
                  <FaClock className="shift-time-icon" aria-hidden="true" />
                  {formatTime(shift.start)} - {formatTime(shift.end)}
                </span>
              </div>
              
              <div className="shift-detail-row">
                <span className="shift-label">Duración:</span>
                <span className="shift-value">{duration} horas</span>
              </div>
            </div>
          </div>

          <div className="shift-detail-section">
            <h4 className="shift-section-title">
              <FaBuilding className="shift-section-icon" aria-hidden="true" />
              Información del Puesto
            </h4>
            <div className="shift-detail-grid">
              <div className="shift-detail-row">
                <span className="shift-label">Rol:</span>
                <span className="shift-role-badge">{shift.role}</span>
              </div>
              
              <div className="shift-detail-row">
                <span className="shift-label">Departamento:</span>
                <span className="shift-value">{shift.department}</span>
              </div>
              
              <div className="shift-detail-row">
                <span className="shift-label">Ubicación:</span>
                <span className="shift-location-badge">
                  <FaMapMarkerAlt className="shift-location-icon" aria-hidden="true" />
                  {shift.location}
                </span>
              </div>
            </div>
          </div>

          <div className="shift-detail-section">
            <h4 className="shift-section-title">
              <FaCheckCircle className="shift-section-icon" aria-hidden="true" />
              Estado y Tipo
            </h4>
            <div className="shift-detail-grid">
              <div className="shift-detail-row">
                <span className="shift-label">Estado:</span>
                <div className="shift-status-badge">
                  <FaCheckCircle className="shift-status-icon" aria-hidden="true" />
                  Confirmado
                </div>
              </div>
              
              <div className="shift-detail-row">
                <span className="shift-label">Tipo de Turno:</span>
                <span 
                  className="shift-type-badge"
                  style={{ 
                    backgroundColor: getShiftTypeColor(shift.type)
                  }}
                >
                  {theme.icon}
                  {theme.label}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="shift-details-actions">
          <button onClick={onExport} className="shift-btn shift-btn-primary">
            <FaDownload className="shift-btn-icon" aria-hidden="true" />
            Exportar
          </button>
          <button className="shift-btn shift-btn-secondary">
            <FaExchangeAlt className="shift-btn-icon" aria-hidden="true" />
            Solicitar Cambio
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShiftDetails;