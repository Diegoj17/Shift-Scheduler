import { useState } from 'react';
import { FaClock, FaFilter, FaCalendarDay, FaSearch, FaTimesCircle } from 'react-icons/fa';
import '../../../styles/components/calendar/user/ShiftFilters.css';

const ShiftFilters = ({ onDateRangeChange, loading }) => {
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  // ✅ Solo actualiza el estado local, NO ejecuta el filtro
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange({
      ...dateRange,
      [name]: value
    });
  };

  // ✅ Ejecutar búsqueda solo cuando se presiona el botón
  const handleSearch = () => {
    if (!dateRange.start || !dateRange.end) {
      alert('Por favor selecciona ambas fechas para filtrar');
      return;
    }

    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    if (startDate.getTime() > endDate.getTime()) {
      alert('La fecha de inicio no puede ser mayor que la fecha de fin');
      return;
    }

    console.log('🔍 Ejecutando búsqueda de turnos...');
    onDateRangeChange(startDate, endDate);
  };

  // ✅ Limpiar filtros
  const handleClearFilters = () => {
    setDateRange({
      start: '',
      end: ''
    });
    console.log('🧹 Filtros limpiados');
  };

  const setQuickRange = (e) => {
    e.preventDefault();
    const days = parseInt(e.currentTarget.dataset.days);
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days + 1);
    
    const newDateRange = {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
    
    setDateRange(newDateRange);
    // Ejecutar automáticamente para filtros rápidos
    onDateRangeChange(start, end);
  };

  const setFutureRange = (e) => {
    e.preventDefault();
    const days = parseInt(e.currentTarget.dataset.days);
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);
    
    const newDateRange = {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
    
    setDateRange(newDateRange);
    // Ejecutar automáticamente para filtros rápidos
    onDateRangeChange(start, end);
  };

  return (
    <div className="shift-filters">
      <div className="shift-filters-header">
        <div className="shift-filters-title">
          <FaFilter className="shift-filter-icon" aria-hidden="true" />
          <h3>Filtrar Turnos</h3>
        </div>
        
        {/* ✅ BOTONES DE ACCIÓN - Arriba a la derecha */}
        <div className="shift-filters-actions">
          <button
            type="button"
            onClick={handleClearFilters}
            disabled={loading}
            className="shift-filter-action-btn shift-filter-clear-btn"
            aria-label="Limpiar filtros"
          >
            <FaTimesCircle />
            <span>Limpiar</span>
          </button>
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading || !dateRange.start || !dateRange.end}
            className="shift-filter-action-btn shift-filter-search-btn"
            aria-label="Buscar turnos"
          >
            <FaSearch />
            <span>Buscar</span>
          </button>
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
              max={dateRange.end || undefined}
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
              min={dateRange.start || undefined}
            />
          </div>
        </div>
        
        <div className="shift-quick-filters">
          <span className="shift-quick-label">Rápidos:</span>
          <div className="shift-quick-buttons">
            <button
              type="button"
              onClick={setQuickRange}
              data-days="7"
              disabled={loading}
              className="shift-quick-btn"
              aria-label="Últimos 7 días"
            >
              <FaClock className="shift-quick-icon" aria-hidden="true" />
              7 días
            </button>
            <button
              type="button"
              onClick={setQuickRange}
              data-days="30"
              disabled={loading}
              className="shift-quick-btn"
              aria-label="Últimos 30 días"
            >
              <FaClock className="shift-quick-icon" aria-hidden="true" />
              30 días
            </button>
            <button
              type="button"
              onClick={setFutureRange}
              data-days="30"
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