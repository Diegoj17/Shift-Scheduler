import React from 'react';
import { MdCheck, MdClose, MdInsertChart, MdAccessTime } from 'react-icons/md';
import '../../../../styles/components/time/user/availability/TimeAvailabilityStats.css';

const TimeAvailabilityStats = ({ availabilities }) => {
  const totalAvailabilities = availabilities.length;
  const availableCount = availabilities.filter(a => a.type === 'available').length;
  const unavailableCount = availabilities.filter(a => a.type === 'unavailable').length;

  const calcularHoras = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    try {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      let hours = (end - start) / (1000 * 60 * 60);
      
      if (hours < 0) {
        hours += 24;
      }
      
      return hours;
    } catch {
      return 0;
    }
  };

  const horasDisponibles = availabilities
    .filter(a => a.type === 'available')
    .reduce((sum, a) => {
      const startTime = a.start_time || a.startTime;
      const endTime = a.end_time || a.endTime;
      return sum + calcularHoras(startTime, endTime);
    }, 0);

  return (
    <div className="time-availability-stats-grid">
      <div className="time-availability-stats-card">
        <div className="time-availability-stats-icon available" aria-hidden="true">
          <MdCheck size={25} />
        </div>
        <div className="time-availability-stats-content">
          <div className="time-availability-stats-label">Disponibles</div>
          <div className="time-availability-stats-value">{availableCount}</div>
        </div>
      </div>

      <div className="time-availability-stats-card">
        <div className="time-availability-stats-icon unavailable" aria-hidden="true">
          <MdClose size={25} />
        </div>
        <div className="time-availability-stats-content">
          <div className="time-availability-stats-label">No Disponibles</div>
          <div className="time-availability-stats-value">{unavailableCount}</div>
        </div>
      </div>

      <div className="time-availability-stats-card">
        <div className="time-availability-stats-icon total" aria-hidden="true">
          <MdInsertChart size={25} />
        </div>
        <div className="time-availability-stats-content">
          <div className="time-availability-stats-label">Total Registros</div>
          <div className="time-availability-stats-value">{totalAvailabilities}</div>
        </div>
      </div>

      <div className="time-availability-stats-card">
        <div className="time-availability-stats-icon hours" aria-hidden="true">
          <MdAccessTime size={25} />
        </div>
        <div className="time-availability-stats-content">
          <div className="time-availability-stats-label">Total Horas</div>
          <div className="time-availability-stats-value">{horasDisponibles.toFixed(1)}h</div>
        </div>
      </div>
    </div>
  );
};

export default TimeAvailabilityStats;