import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaSun, FaClock, FaCalendarDay, FaBuilding, FaCheckCircle } from 'react-icons/fa';
import { FiSun, FiClock, FiMoon} from 'react-icons/fi';
import '../../../styles/components/calendar/user/ShiftDetails.css';

const ShiftDetailsView = ({ shift, isOpen, onClose, onEdit }) => {
  const [notesExpanded, setNotesExpanded] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    return () => {
      body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setNotesExpanded(false);
    }
  }, [isOpen, shift?.id]);

  if (!isOpen || !shift) return null;

  const getRawTimeValue = (value) => {
    if (!value) return null;

    if (typeof value === 'string') {
      const match = value.match(/(\d{2}:\d{2})(?::\d{2})?/);
      if (match) return match[1];
    }

    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }

    return null;
  };

  const getDurationHours = (shift) => {
    const startValue = shift.extendedProps?.start_time || shift.start_time || shift.startTime || shift.start;
    const endValue = shift.extendedProps?.end_time || shift.end_time || shift.endTime || shift.end;
    const startTime = getRawTimeValue(startValue);
    const endTime = getRawTimeValue(endValue);

    if (startTime && endTime && /^\d{2}:\d{2}$/.test(startTime) && /^\d{2}:\d{2}$/.test(endTime)) {
      const [startHours, startMinutes] = startTime.split(':').map(Number);
      const [endHours, endMinutes] = endTime.split(':').map(Number);
      let startTotalMinutes = startHours * 60 + startMinutes;
      let endTotalMinutes = endHours * 60 + endMinutes;

      if (endTotalMinutes <= startTotalMinutes) {
        endTotalMinutes += 24 * 60;
      }

      return Math.round((endTotalMinutes - startTotalMinutes) / 60);
    }

    if (shift.start && shift.end) {
      let diffMs = new Date(shift.end) - new Date(shift.start);
      if (diffMs < 0) {
        diffMs += 24 * 60 * 60 * 1000;
      }
      return Math.round(diffMs / (1000 * 60 * 60));
    }

    return 0;
  };

  const getShiftTypeFromData = (shift) => {
    const color = shift.backgroundColor || shift.color;
    
    if (color === '#4caf50') return 'morning';
    if (color === '#ffc107') return 'afternoon';
    if (color === '#2196F3') return 'night';
    
    if (shift.start) {
      const startHour = new Date(shift.start).getHours();
      if (startHour >= 6 && startHour < 12) return 'morning';
      if (startHour >= 12 && startHour < 18) return 'afternoon';
      return 'night';
    }
    
    return 'morning';
  };

  const formatTime = (dateString) => {
    const rawTime = getRawTimeValue(dateString);
    if (rawTime) {
      const [hours, minutes] = rawTime.split(':').map(Number);
      const period = hours >= 12 ? 'pm' : 'am';
      const normalizedHours = hours % 12 || 12;
      return `${String(normalizedHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
    }

    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toLowerCase();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getThemeForType = (type) => {
    const themes = {
      morning: { primary: '#4CAF50', dark: '#388E3C', icon: <FiSun />, label: 'Mañana' },
      afternoon: { primary: '#FFC107', dark: '#FFA000', icon: <FiClock />, label: 'Tarde' },
      night: { primary: '#2196F3', dark: '#1976D2', icon: <FiMoon />, label: 'Noche' }
    };
    return themes[type] || themes['night'];
  };

  const correctShiftType = getShiftTypeFromData(shift);
  const theme = getThemeForType(correctShiftType);
  const actualColor = shift.backgroundColor || shift.color || theme.primary;

    const notes = shift.extendedProps?.notes || shift.notes || shift.note || shift.comment || '';
    const hasLongNotes = notes.length > 140 || notes.includes('\n');
  const duration = getDurationHours(shift);

  // Obtener el departamento con múltiples fallbacks
  const department =
    shift.department ||
    shift.area ||
    shift.employee_area ||
    shift.employee_department ||
    shift.departamento ||
    shift.extendedProps?.department ||
    shift.extendedProps?.area ||
    '—';

  const modal = (
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
          <span aria-hidden="true">X</span>
        </button>
        
        <div className="shift-details-header">
          <div
            className="shift-type-indicator"
            style={{ backgroundColor: actualColor }}
          >
            {theme.icon}
          </div>
          <div className="shift-header-content">
            <h2>Detalles del Turno</h2>
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
                <span className="shift-value">
                  {department}
                </span>
              </div>
            </div>
          </div>

          {notes && (
            <div className="shift-detail-section">
              <h4 className="shift-section-title">
                <FaCalendarDay className="shift-section-icon" aria-hidden="true" />
                Notas
              </h4>
              <div className="shift-detail-grid">
                <div className="shift-detail-row shift-notes-row" style={{ gridColumn: '1 / -1' }}>
                  <div className={`shift-notes-content ${hasLongNotes && !notesExpanded ? 'is-collapsed' : ''}`}>
                    {notes}
                  </div>
                  {hasLongNotes && (
                    <button
                      type="button"
                      className="shift-notes-toggle"
                      onClick={() => setNotesExpanded((value) => !value)}
                    >
                      {notesExpanded ? 'Ver menos' : 'Ver más'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

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
                    backgroundColor: actualColor
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
          <button 
            onClick={() => {
              onClose();
              if (onEdit && typeof onEdit === 'function') {
                onEdit(shift);
              }
            }} 
            className="shift-btn shift-btn-primary"
          >
            Editar
          </button>
          <button onClick={onClose} className="shift-btn shift-btn-secondary">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default ShiftDetailsView;
