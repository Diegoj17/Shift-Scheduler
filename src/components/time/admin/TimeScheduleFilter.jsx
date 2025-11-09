import React from 'react';
import '../../../styles/components/time/admin/TimeScheduleFilter.css';
import { MdSearch } from 'react-icons/md';

const TimeScheduleFilter = ({ onFilterChange, filters, onReset }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  return (
    <div className="time-schedule-filter-card">
      <div className="time-schedule-filter-header">
        <div className="time-schedule-filter-icon"><MdSearch size={25} /></div>
        <div>
          <h2 className="time-schedule-filter-title">Filtros de Búsqueda</h2>
          <p className="time-schedule-filter-subtitle">Refina tu consulta con los siguientes criterios</p>
        </div>
      </div>

      <div className="time-schedule-filter-form">
        {/* Date Range */}
        <div className="time-schedule-filter-row">
          <div className="time-schedule-filter-group">
            <label className="time-schedule-filter-label">Fecha inicio</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleChange}
              className="time-schedule-filter-input"
            />
          </div>

          <div className="time-schedule-filter-group">
            <label className="time-schedule-filter-label">Fecha fin</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleChange}
              className="time-schedule-filter-input"
            />
          </div>
        </div>

        {/* Employee Search */}
        <div className="time-schedule-filter-group">
          <label className="time-schedule-filter-label">Empleado</label>
          <input
            type="text"
            name="employee"
            value={filters.employee}
            onChange={handleChange}
            placeholder="Buscar por nombre..."
            className="time-schedule-filter-input"
          />
        </div>

        {/* Area and Role */}
        <div className="time-schedule-filter-row">
          <div className="time-schedule-filter-group">
            <label className="time-schedule-filter-label">Departamento</label>
            <select
              name="area"
              value={filters.area}
              onChange={handleChange}
              className="time-schedule-filter-input"
            >
              <option value="">Todos los departamentos</option>
              <option value="Ventas">Ventas</option>
              <option value="Soporte">Soporte</option>
              <option value="Administración">Administración</option>
            </select>
          </div>

          <div className="time-schedule-filter-group">
            <label className="time-schedule-filter-label">Puesto</label>
            <select
              name="role"
              value={filters.role}
              onChange={handleChange}
              className="time-schedule-filter-input"
            >
              <option value="">Todos los puestos</option>
              <option value="Vendedor">Vendedor</option>
              <option value="Técnico">Técnico</option>
              <option value="Asistente">Asistente</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="time-schedule-filter-actions">
          <button 
            type="button" 
            className="time-schedule-filter-reset"
            onClick={onReset}
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeScheduleFilter;