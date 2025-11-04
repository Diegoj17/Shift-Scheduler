import React from 'react';
import { FaRegClock, FaCalendarAlt } from 'react-icons/fa';
import '../../../styles/components/dashboard/user/TodayScheduleCard.css';

const TodayScheduleCard = ({ schedule, onClockAction }) => {
  return (
    <div className="today-schedule-wrapper">
      <h3 className="today-schedule-heading">
        <span className="today-schedule-title-icon"><FaCalendarAlt /></span>
        Turno de Hoy
      </h3>

      <div className="today-schedule-info-list">
        <div className="schedule-info-row">
          <span className="schedule-info-label">Horario:</span>
          <span className="schedule-info-value">{schedule.shift}</span>
        </div>

        <div className="schedule-info-row">
          <span className="schedule-info-label">Estado:</span>
          <span className={`schedule-status-badge ${schedule.status.toLowerCase()}`}>
            <span className="status-indicator"></span>
            {schedule.status}
          </span>
        </div>

        <div className="schedule-info-row">
          <span className="schedule-info-label">Próximo Descanso:</span>
          <span className="schedule-info-value">{schedule.nextBreak}</span>
        </div>
      </div>

      <button className="schedule-clock-action-btn" onClick={onClockAction}>
        <FaRegClock className="clock-btn-icon" />
        Registrar Entrada/Salida
      </button>
    </div>
  );
};

export default TodayScheduleCard;