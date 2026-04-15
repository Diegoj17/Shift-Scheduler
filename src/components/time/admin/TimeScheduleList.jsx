import React, { useState } from 'react';
import { AVAILABILITY_COLORS } from '../../../services/availabilityService';
import '../../../styles/components/time/admin/TimeScheduleList.css';
import { MdCalendarToday, MdAccessTime, MdTimer, MdBusiness, MdCheckCircle, MdCancel } from 'react-icons/md';

const TimeScheduleList = ({ availabilities }) => {
  const [sortBy, setSortBy] = useState('date');
  const [filterType, setFilterType] = useState('all');

  const filteredAvailabilities = availabilities.filter(avail => {
    if (filterType === 'all') return true;
    return avail.type === filterType;
  });

  const sortedAvailabilities = [...filteredAvailabilities].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(a.date) - new Date(b.date);
      case 'employee':
        // ✅ Usar employee_name del backend
        const nameA = a.employee_name || '';
        const nameB = b.employee_name || '';
        return nameA.localeCompare(nameB);
      case 'area':
        // ✅ Usar employee_area del backend
        const areaA = a.employee_area || '';
        const areaB = b.employee_area || '';
        return areaA.localeCompare(areaB);
      default:
        return 0;
    }
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Sin fecha';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (startTime, endTime) => {
    const to12 = (t) => {
      if (!t) return '';
      try {
        const [hh, mm] = t.split(':').map(Number);
        const period = hh >= 12 ? 'pm' : 'am';
        const h12 = hh % 12 === 0 ? 12 : hh % 12;
        return `${h12}:${String(mm).padStart(2, '0')} ${period}`;
      } catch {
        return t;
      }
    };
    return `${to12(startTime)} - ${to12(endTime)}`;
  };

  const resolveAvailabilityColor = (avail) => {
    const fromBackend = avail?.adminResolvedColor || avail?.resolvedColor || avail?.color || avail?.status_color || avail?.availability_color || avail?.type_color;
    if (typeof fromBackend === 'string' && fromBackend.trim()) return fromBackend.trim();
    return avail?.type === 'available' ? AVAILABILITY_COLORS.AVAILABLE : AVAILABILITY_COLORS.UNAVAILABLE;
  };

  const toRgba = (hex, alpha = 0.16) => {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return `rgba(15, 23, 42, ${alpha})`;
    const clean = hex.replace('#', '');
    const expanded = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
    if (expanded.length !== 6) return `rgba(15, 23, 42, ${alpha})`;
    const r = parseInt(expanded.substring(0, 2), 16);
    const g = parseInt(expanded.substring(2, 4), 16);
    const b = parseInt(expanded.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '0h';
    try {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      let hours = (end - start) / (1000 * 60 * 60);
      
      // Si es turno nocturno (cruza medianoche)
      if (hours < 0) {
        hours += 24;
      }
      
      return `${hours.toFixed(1)}h`;
    } catch {
      return '0h';
    }
  };

  if (!availabilities || availabilities.length === 0) {
    return (
      <div className="time-schedule-list-section">
        <div className="time-schedule-list-header">
          <div>
            <h2 className="time-schedule-list-title">Lista de Disponibilidades</h2>
            <p className="time-schedule-list-subtitle">No hay registros disponibles</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="time-schedule-list-section">
      <div className="time-schedule-list-header">
        <div>
          <h2 className="time-schedule-list-title">Lista de Disponibilidades</h2>
          <p className="time-schedule-list-subtitle">
            {sortedAvailabilities.length} registro{sortedAvailabilities.length !== 1 ? 's' : ''} encontrado{sortedAvailabilities.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="time-schedule-list-controls">
        <div className="time-schedule-list-filters">
          <button 
            className={`time-schedule-list-filter-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            Todos
          </button>
          <button 
            className={`time-schedule-list-filter-btn ${filterType === 'available' ? 'active' : ''}`}
            onClick={() => setFilterType('available')}
          >
            Disponible
          </button>
          <button 
            className={`time-schedule-list-filter-btn ${filterType === 'unavailable' ? 'active' : ''}`}
            onClick={() => setFilterType('unavailable')}
          >
            No disponible
          </button>
        </div>

        <div className="time-schedule-list-sort">
          <label className="time-schedule-list-sort-label">Ordenar por:</label>
          <select 
            className="time-schedule-list-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Fecha</option>
            <option value="employee">Empleado</option>
            <option value="area">Área</option>
          </select>
        </div>
      </div>

      <div className="time-schedule-list-items">
        {sortedAvailabilities.map(avail => {
          // ✅ Extraer datos con valores por defecto
          const employeeName = avail.employee_name || 'Sin nombre';
          const employeePosition = avail.employee_position || 'Sin puesto';
          const employeeArea = avail.employee_area || 'Sin área';
          const startTime = avail.start_time || '00:00';
          const endTime = avail.end_time || '00:00';
          const availType = avail.type || 'available';
          const availabilityColor = resolveAvailabilityColor(avail);

          return (
            <div
              key={avail.id}
              className={`time-schedule-list-item ${availType}`}
              style={{ '--availability-color': availabilityColor }}
            >
              <div className="time-schedule-list-item-header">
                <div className="time-schedule-list-item-employee">
                  <div className="time-schedule-list-item-avatar">
                    {employeeName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="time-schedule-list-item-name">{employeeName}</div>
                    <div className="time-schedule-list-item-role">{employeePosition}</div>
                  </div>
                </div>
                <span
                  className={`time-schedule-list-item-badge ${availType}`}
                  style={{
                    backgroundColor: toRgba(availabilityColor, 0.16),
                    color: availabilityColor,
                    border: `1px solid ${toRgba(availabilityColor, 0.35)}`
                  }}
                >
                  {availType === 'available' ? (
                    <>
                      <MdCheckCircle style={{ marginRight: 8 }} />
                      Disponible
                    </>
                  ) : (
                    <>
                      <MdCancel style={{ marginRight: 8 }} />
                      No disponible
                    </>
                  )}
                </span>
              </div>

              <div className="time-schedule-list-item-details">
                <div className="time-schedule-list-item-detail">
                  <span className="time-schedule-list-item-detail-icon"><MdCalendarToday /></span>
                  <div>
                    <div className="time-schedule-list-item-detail-label">Fecha</div>
                    <div className="time-schedule-list-item-detail-value">{formatDate(avail.date)}</div>
                  </div>
                </div>

                <div className="time-schedule-list-item-detail">
                  <span className="time-schedule-list-item-detail-icon"><MdAccessTime /></span>
                  <div>
                    <div className="time-schedule-list-item-detail-label">Horario</div>
                    <div className="time-schedule-list-item-detail-value">{formatTime(startTime, endTime)}</div>
                  </div>
                </div>

                <div className="time-schedule-list-item-detail">
                  <span className="time-schedule-list-item-detail-icon"><MdTimer /></span>
                  <div>
                    <div className="time-schedule-list-item-detail-label">Duración</div>
                    <div className="time-schedule-list-item-detail-value">{calculateDuration(startTime, endTime)}</div>
                  </div>
                </div>

                <div className="time-schedule-list-item-detail">
                  <span className="time-schedule-list-item-detail-icon"><MdBusiness /></span>
                  <div>
                    <div className="time-schedule-list-item-detail-label">Área</div>
                    <div className="time-schedule-list-item-detail-value">{employeeArea}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimeScheduleList;
