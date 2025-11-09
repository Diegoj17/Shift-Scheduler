import React from 'react';
import { MdAccessTime, MdEvent } from 'react-icons/md';
import '../../../styles/components/time/user/TimeSummary.css';

const TimeSummary = ({ shiftData }) => {
  // ✅ Determinar estado del día
  const getDayStatus = () => {
    if (shiftData.exitRegistered && shiftData.entryRegistered) {
      return {
        text: 'Jornada Completada',
        class: 'time-summary-status-completed'
      };
    } else if (shiftData.entryRegistered) {
      return {
        text: 'En Turno',
        class: 'time-summary-status-active'
      };
    } else if (shiftData.hasActiveShift) {
      return {
        text: 'Pendiente',
        class: 'time-summary-status-pending'
      };
    } else {
      return {
        text: 'Sin Turno',
        class: 'time-summary-status-inactive'
      };
    }
  };

  const status = getDayStatus();

  return (
    <div className="time-summary-section">
      <div className="time-summary-card">
        <div className="time-summary-icon" aria-hidden="true">
          <MdEvent size={24} />
        </div>
        <div className="time-summary-content">
          <p className="time-summary-label">Turno</p>
          <p className="time-summary-value">{shiftData.shiftTypeName}</p>
        </div>
      </div>

      <div className="time-summary-card">
        <div className="time-summary-icon" aria-hidden="true">
          <MdAccessTime size={24} />
        </div>
        <div className="time-summary-content">
          <p className="time-summary-label">Horario</p>
          <p className="time-summary-value">
            {shiftData.shiftStart} - {shiftData.shiftEnd}
          </p>
        </div>
      </div>

      <div className="time-summary-card">
        <div className="time-summary-icon" aria-hidden="true">
          <MdAccessTime size={24} />
        </div>
        <div className="time-summary-content">
          <p className="time-summary-label">Estado</p>
          <span className={`time-summary-status ${status.class}`}>
            {status.text}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimeSummary;