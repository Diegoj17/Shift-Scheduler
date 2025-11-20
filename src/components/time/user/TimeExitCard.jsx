import React from 'react';
import TimeDigitalClock from './TimeDigitalClock';
import { MdLogout } from 'react-icons/md';
import { formatTime } from '../../../utils/dateUtils';
import '../../../styles/components/time/user/TimeExitCard.css';

const TimeExitCard = ({ onRegister, isDisabled, shiftData }) => {
  const getStatusText = () => {
    if (!shiftData.entryRegistered) {
      return 'Pendiente entrada';
    }
    if (shiftData.exitRegistered) {
      return 'Registrado';
    }
    return 'En curso';
  };

  const getStatusClass = () => {
    if (!shiftData.entryRegistered) {
      return 'time-status-pending';
    }
    if (shiftData.exitRegistered) {
      return 'time-status-completed';
    }
    return 'time-status-active';
  };

  return (
    <div className="time-card time-card-exit">
      {/* Header */}
      <div className="time-card-header">
        <div className="time-card-icon" aria-hidden="true">
          <MdLogout size={22} />
        </div>
        <div className="time-card-title-wrapper">
          <h2 className="time-card-title">Registrar Salida</h2>
          <p className="time-card-subtitle">Finaliza tu jornada laboral</p>
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
          <span className="time-shift-info-label">Hora de salida</span>
          <span className="time-shift-info-value">{formatTime(shiftData.shiftEnd)}</span>
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
        className="time-register-button time-register-button-exit"
        onClick={onRegister}
        disabled={isDisabled}
      >
        <span className="time-button-icon">✓</span>
        <span className="time-button-text">
          {shiftData.exitRegistered ? 'Salida Registrada' : 'Registrar Salida'}
        </span>
      </button>

      {/* Mostrar hora de salida si ya está registrada */}
      {shiftData.exitRegistered && shiftData.todayEntries?.check_out && (
        <div className="time-registered-info">
          <small>
            Salida registrada a las {formatTime(shiftData.todayEntries.check_out.timestamp || shiftData.todayEntries.check_out.time_local || shiftData.todayEntries.check_out.time)}
          </small>
        </div>
      )}
    </div>
  );
};

export default TimeExitCard;