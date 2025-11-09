import React from 'react';
import '../../../styles/components/time/admin/TimeScheduleStats.css';
import { MdPeople, MdCheckCircle, MdTimer, MdBusiness } from 'react-icons/md';

const TimeScheduleStats = ({ availabilities }) => {
  const totalEmployees = new Set(availabilities.map(a => a.employeeName)).size;
  const availableCount = availabilities.filter(a => a.type === 'available').length;

  // Calcular total de horas disponibles
  const totalAvailableHours = availabilities
    .filter(a => a.type === 'available')
    .reduce((sum, avail) => {
      const start = new Date(`2000-01-01T${avail.startTime}`);
      const end = new Date(`2000-01-01T${avail.endTime}`);
      const hours = (end - start) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

  // Áreas con más disponibilidad
  const areaStats = availabilities.reduce((acc, avail) => {
    if (avail.type === 'available') {
      acc[avail.area] = (acc[avail.area] || 0) + 1;
    }
    return acc;
  }, {});

  const topArea = Object.keys(areaStats).length > 0
    ? Object.keys(areaStats).reduce((a, b) => areaStats[a] > areaStats[b] ? a : b)
    : 'N/A';

  return (
    <div className="time-schedule-stats-grid">
      <div className="time-schedule-stats-card">
        <div className="time-schedule-stats-icon employees">
          <MdPeople size={25} />
        </div>
        <div className="time-schedule-stats-content">
          <div className="time-schedule-stats-label">Empleados</div>
          <div className="time-schedule-stats-value">{totalEmployees}</div>
          <div className="time-schedule-stats-description">Total registrados</div>
        </div>
      </div>

      <div className="time-schedule-stats-card">
        <div className="time-schedule-stats-icon available">
          <MdCheckCircle size={25} />
        </div>
        <div className="time-schedule-stats-content">
          <div className="time-schedule-stats-label">Disponibles</div>
          <div className="time-schedule-stats-value">{availableCount}</div>
          <div className="time-schedule-stats-description">Registros activos</div>
        </div>
      </div>

      <div className="time-schedule-stats-card">
        <div className="time-schedule-stats-icon hours">
          <MdTimer size={25} />
        </div>
        <div className="time-schedule-stats-content">
          <div className="time-schedule-stats-label">Horas Totales</div>
          <div className="time-schedule-stats-value">{totalAvailableHours.toFixed(0)}h</div>
          <div className="time-schedule-stats-description">Disponibilidad</div>
        </div>
      </div>

      <div className="time-schedule-stats-card">
        <div className="time-schedule-stats-icon area">
          <MdBusiness size={25} />
        </div>
        <div className="time-schedule-stats-content">
          <div className="time-schedule-stats-label">Área Principal</div>
          <div className="time-schedule-stats-value">{topArea}</div>
          <div className="time-schedule-stats-description">Mayor disponibilidad</div>
        </div>
      </div>
    </div>
  );
};

export default TimeScheduleStats;