import React, { useState } from 'react';
import '../../../styles/components/calendar/user/ShiftFilters.css';
import { FiClock } from 'react-icons/fi';

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
      <div className="filters-header">
        <h3>Filtrar Turnos</h3>
      </div>
      
      <div className="date-controls">
        <div className="date-inputs">
          <div className="input-group">
            <label htmlFor="start-date">Desde:</label>
            <input
              type="date"
              id="start-date"
              name="start"
              value={dateRange.start}
              onChange={handleDateChange}
              disabled={loading}
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="end-date">Hasta:</label>
            <input
              type="date"
              id="end-date"
              name="end"
              value={dateRange.end}
              onChange={handleDateChange}
              disabled={loading}
            />
          </div>
        </div>
        
        <div className="quick-filters">
          <span>Rápidos:</span>
          <button
            onClick={() => setQuickRange(7)}
            disabled={loading}
            className="quick-btn"
            aria-label="Últimos 7 días"
          >
            <FiClock className="quick-icon" size={16} aria-hidden="true" />
            Últimos 7 días
          </button>
          <button
            onClick={() => setQuickRange(30)}
            disabled={loading}
            className="quick-btn"
            aria-label="Últimos 30 días"
          >
            <FiClock className="quick-icon" size={16} aria-hidden="true" />
            Últimos 30 días
          </button>
          <button
            onClick={() => setQuickRange(90)}
            disabled={loading}
            className="quick-btn"
            aria-label="Últimos 3 meses"
          >
            <FiClock className="quick-icon" size={16} aria-hidden="true" />
            Últimos 3 meses
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShiftFilters;