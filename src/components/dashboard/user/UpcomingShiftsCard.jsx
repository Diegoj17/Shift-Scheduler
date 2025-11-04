import React from 'react';
import { FaCalendarAlt, FaSun } from 'react-icons/fa';
import '../../../styles/components/dashboard/user/UpcomingShiftsCard.css';

const UpcomingShiftsCard = ({ shifts = [] }) => {
  return (
    <div className="upcoming-shifts-container">
      <h3 className="upcoming-shifts-header">Próximos Turnos</h3>
      
      <div className="upcoming-shifts-timeline">
        {shifts.map((shift, index) => (
          <div key={index} className="shift-timeline-entry">
            <div className="shift-entry-date-section" aria-hidden>
              <div className="shift-date-day">
                {new Date(shift.date).toLocaleDateString('es-ES', { day: 'numeric' })}
              </div>
              <div className="shift-date-month">
                {new Date(shift.date).toLocaleDateString('es-ES', { month: 'short' })}
              </div>
              <div className="shift-date-weekday">
                {new Date(shift.date).toLocaleDateString('es-ES', { weekday: 'short' })}
              </div>
            </div>
            
            <div className="shift-entry-details">
              <div className="shift-details-type">{shift.shift}</div>
              <div className="shift-details-hours">{shift.hours}</div>
            </div>
            
            <div className={`shift-entry-badge ${shift.shift === 'Libre' ? 'badge-free' : 'badge-scheduled'}`}>
              <span className="badge-icon">
                {shift.shift === 'Libre' ? <FaSun /> : <FaCalendarAlt />}
              </span>
              <span className="badge-text">{shift.shift === 'Libre' ? 'Libre' : 'Confirmado'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingShiftsCard;