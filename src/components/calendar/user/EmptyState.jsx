import { FaCalendarAlt, FaSync } from 'react-icons/fa';
import '../../../styles/components/calendar/user/EmptyState.css';

const EmptyState = ({ onResetFilters }) => {
  return (
    <div className="shift-empty-state">
      <div className="shift-empty-illustration">
        <FaCalendarAlt className="shift-empty-icon" aria-hidden="true" />
      </div>
      <div className="shift-empty-content">
        <h3>Sin turnos en el rango seleccionado</h3>
        <p>No se encontraron turnos asignados para las fechas seleccionadas.</p>
      </div>
      <button onClick={onResetFilters} className="shift-reset-btn">
        <FaSync className="shift-reset-icon" aria-hidden="true" />
        Ver todos los turnos
      </button>
    </div>
  );
};

export default EmptyState;