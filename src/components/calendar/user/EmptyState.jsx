import React from 'react';
import '../../../styles/components/calendar/user/EmptyState.css';
import { FiCalendar } from 'react-icons/fi';

const EmptyState = ({ onResetFilters }) => {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <FiCalendar size={64} aria-hidden="true" />
      </div>
      <h3>Sin turnos en el rango seleccionado</h3>
      <p>No se encontraron turnos asignados para las fechas seleccionadas.</p>
      <button onClick={onResetFilters} className="reset-btn shift-reset-btn">
        Ver todos los turnos
      </button>
    </div>
  );
};

export default EmptyState;