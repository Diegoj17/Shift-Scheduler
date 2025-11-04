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
      onDateRangeChange(new Date(newDateRange.start), new Date(newDateRange.end));
    }
  };

  const setQuickRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });
    
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
            />
          </div>
        </div>
        
        <div className="shift-quick-filters">
          <span className="shift-quick-label">Rápidos:</span>
          <div className="shift-quick-buttons">
            <button
              onClick={() => setQuickRange(7)}
              disabled={loading}
              className="shift-quick-btn"
              aria-label="Últimos 7 días"
            >
              <FaClock className="shift-quick-icon" aria-hidden="true" />
              Últimos 7 días
            </button>
            <button
              onClick={() => setQuickRange(30)}
              disabled={loading}
              className="shift-quick-btn"
              aria-label="Últimos 30 días"
            >
              <FaClock className="shift-quick-icon" aria-hidden="true" />
              Últimos 30 días
            </button>
            <button
              onClick={() => setQuickRange(90)}
              disabled={loading}
              className="shift-quick-btn"
              aria-label="Últimos 3 meses"
            >
              <FaClock className="shift-quick-icon" aria-hidden="true" />
              Últimos 3 meses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftFilters;