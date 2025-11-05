import { useState } from 'react';
import { FaClock, FaFilter, FaCalendarDay } from 'react-icons/fa';
import '../../../styles/components/calendar/user/ShiftFilters.css';

const ShiftFilters = ({ onDateRangeChange, loading }) => {
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    const newDateRange = {
      ...dateRange,
      [name]: value
    };
    
    setDateRange(newDateRange);
    
    // Solo ejecutar si ambas fechas están completas
    if (newDateRange.start && newDateRange.end) {
      const startDate = new Date(newDateRange.start);
      const endDate = new Date(newDateRange.end);
      
      // Validar que la fecha de inicio no sea mayor que la de fin
      if (startDate <= endDate) {
        onDateRangeChange(startDate, endDate);
      } else {
        console.warn('La fecha de inicio no puede ser mayor que la fecha de fin');
        // Opcional: mostrar mensaje al usuario o intercambiar fechas
      }
    }
  };

  const setQuickRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days + 1); // +1 para incluir el día actual
    
    const newDateRange = {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
    
    setDateRange(newDateRange);
    onDateRangeChange(start, end);
  };

  // Función para establecer rango futuro
  const setFutureRange = (days) => {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);
    
    const newDateRange = {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
    
    setDateRange(newDateRange);
    onDateRangeChange(start, end);
  };

  return (
    <div className="shift-filters">
      <div className="shift-filters-header">
        <div className="shift-filters-title">
          <FaFilter className="shift-filter-icon" aria-hidden="true" />
          <h3>Filtrar Turnos</h3>
        </div>
      </div>
      
      <div className="shift-date-controls">
        <div className="shift-date-inputs">
          <div className="shift-input-group">
            <label htmlFor="start-date">
              <FaCalendarDay className="shift-label-icon" aria-hidden="true" />
              Desde
            </label>
            <input
              type="date"
              id="start-date"
              name="start"
              value={dateRange.start}
              onChange={handleDateChange}
              disabled={loading}
              className={loading ? 'shift-input-disabled' : ''}
              max={dateRange.end || undefined} // ✅ Limitar fecha máxima
            />
          </div>
          
          <div className="shift-input-group">
            <label htmlFor="end-date">
              <FaCalendarDay className="shift-label-icon" aria-hidden="true" />
              Hasta
            </label>
            <input
              type="date"
              id="end-date"
              name="end"
              value={dateRange.end}
              onChange={handleDateChange}
              disabled={loading}
              className={loading ? 'shift-input-disabled' : ''}
              min={dateRange.start || undefined} // ✅ Limitar fecha mínima
            />
          </div>
        </div>
        
        <div className="shift-quick-filters">
          <span className="shift-quick-label">Rápidos:</span>
          <div className="shift-quick-buttons">
            <button
              type="button"
              onClick={() => setQuickRange(7)}
              disabled={loading}
              className="shift-quick-btn"
              aria-label="Últimos 7 días"
            >
              <FaClock className="shift-quick-icon" aria-hidden="true" />
              7 días
            </button>
            <button
              type="button"
              onClick={() => setQuickRange(30)}
              disabled={loading}
              className="shift-quick-btn"
              aria-label="Últimos 30 días"
            >
              <FaClock className="shift-quick-icon" aria-hidden="true" />
              30 días
            </button>
            <button
              type="button"
              onClick={() => setFutureRange(30)}
              disabled={loading}
              className="shift-quick-btn"
              aria-label="Próximos 30 días"
            >
              <FaClock className="shift-quick-icon" aria-hidden="true" />
              Próximos 30 días
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftFilters;