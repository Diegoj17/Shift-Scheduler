import React from 'react';
import TimeDigitalClock from './TimeDigitalClock';
import { MdLogin } from 'react-icons/md';
import { formatTime } from '../../../utils/dateUtils';
import '../../../styles/components/time/user/TimeEntryCard.css';

const TimeEntryCard = ({ onRegister, isDisabled, shiftData }) => {
  const getStatusText = () => {
    if (!shiftData.hasActiveShift) {
      return 'Sin turno';
    }
    if (shiftData.entryRegistered) {
      return 'Registrado';
    }
    return 'Pendiente';
  };

  const getStatusClass = () => {
    if (!shiftData.hasActiveShift) {
      return 'time-status-inactive';
    }
    if (shiftData.entryRegistered) {
      return 'time-status-completed';
    }
    return 'time-status-active';
  };

  return (
    <div className="time-card time-card-entry">
      {/* Header */}
      <div className="time-card-header">
        <div className="time-card-icon" aria-hidden="true">
          <MdLogin size={22} />
        </div>
        <div className="time-card-title-wrapper">
          <h2 className="time-card-title">Registrar Entrada</h2>
          <p className="time-card-subtitle">Marca tu llegada al turno</p>
        </div>
      </div>

      {/* Digital Clock */}
      <TimeDigitalClock />

      {/* Shift Info */}
      <div className="time-shift-info">
        <div className="time-shift-info-row">
          <span className="time-shift-info-label">Turno asignado</span>
          <span className="time-shift-info-value">{shiftData.shiftTypeName}</span>
        </div>
        <div className="time-shift-info-row">
          <span className="time-shift-info-label">Hora de inicio</span>
          <span className="time-shift-info-value">{formatTime(shiftData.shiftStart)}</span>
        </div>
        <div className="time-shift-info-row">
          <span className="time-shift-info-label">Estado</span>
          <span className={`time-status-badge ${getStatusClass()}`}>
            <span className="time-status-indicator"></span>
            {getStatusText()}
          </span>
        </div>
      </div>

      {/* Register Button */}
      <button 
        className="time-register-button time-register-button-entry"
        onClick={onRegister}
        disabled={isDisabled}
      >
        <span className="time-button-icon">✓</span>
        <span className="time-button-text">
          {shiftData.entryRegistered ? 'Entrada Registrada' : 'Registrar Entrada'}
        </span>
      </button>

      {/* Mostrar hora de entrada si ya está registrada */}
      {shiftData.entryRegistered && shiftData.todayEntries?.check_in && (
        <div className="time-registered-info">
          <small>
            Entrada registrada a las {formatTime(shiftData.todayEntries.check_in.timestamp || shiftData.todayEntries.check_in.time_local || shiftData.todayEntries.check_in.time)}
          </small>
        </div>
      )}
    </div>
  );
};

export default TimeEntryCard;