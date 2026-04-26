import React, { useState } from 'react';
import { AVAILABILITY_COLORS } from '../../../services/availabilityService';
import '../../../styles/components/time/admin/TimeScheduleList.css';
import { MdCalendarToday, MdAccessTime, MdTimer, MdBusiness, MdCheckCircle, MdCancel } from 'react-icons/md';

const TimeScheduleList = ({ availabilities }) => {
  const [sortBy, setSortBy] = useState('date');
  const [filterType, setFilterType] = useState('all');
  const [expandedNotes, setExpandedNotes] = useState({});

  const toggleNotes = (id) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredAvailabilities = availabilities.filter(avail => {
    if (filterType === 'all') return true;
    return avail.type === filterType;
  });

  const sortedAvailabilities = [...filteredAvailabilities].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(a.date) - new Date(b.date);
      case 'employee': {
        const nameA = a.employee_name || '';
        const nameB = b.employee_name || '';
        return nameA.localeCompare(nameB);
      }
      case 'area': {
        const areaA = a.employee_area || '';
        const areaB = b.employee_area || '';
        return areaA.localeCompare(areaB);
      }
      default:
        return 0;
    }
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Sin fecha';
    try {
      // Parse local de YYYY-MM-DD para evitar desfase por zona horaria
      const value = String(dateStr).trim();
      const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      const date = match
        ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
        : new Date(value);
      return date.toLocaleDateString('es-ES', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short',
        year: 'numeric'
      }).toUpperCase();
    } catch {
      return dateStr;
    }
  };

  const formatTime = (startTime, endTime) => {
    const to12 = (t) => {
      if (!t) return '';
      try {
        const [hh, mm] = t.split(':').map(Number);
        const period = hh >= 12 ? 'p. m.' : 'a. m.';
        const h12 = hh % 12 === 0 ? 12 : hh % 12;
        return `${h12}:${String(mm).padStart(2, '0')} ${period}`;
      } catch {
        return t;
      }
    };
    return `${to12(startTime)} - ${to12(endTime)}`;
  };

  const resolveAvailabilityColor = (avail) => {
    const fromBackend = avail?.adminResolvedColor || avail?.resolvedColor || avail?.color;
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
    if (!startTime || !endTime) return '0.0h';
    try {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      let hours = (end - start) / (1000 * 60 * 60);
      if (hours < 0) hours += 24;
      return `${hours.toFixed(1)}h`;
    } catch {
      return '0.0h';
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
            <MdCheckCircle size={14} /> Disponible
          </button>
          <button 
            className={`time-schedule-list-filter-btn ${filterType === 'unavailable' ? 'active' : ''}`}
            onClick={() => setFilterType('unavailable')}
          >
            <MdCancel size={14} /> No disponible
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
        {sortedAvailabilities.map((avail, index) => {
          const employeeName = avail.employee_name || 'Sin nombre';
          const employeePosition = avail.employee_position || 'Sin puesto';
          const employeeArea = avail.employee_area || 'Sin área';
          const startTime = avail.start_time || '00:00';
          const endTime = avail.end_time || '00:00';
          const availType = avail.type || 'available';
          const notesText = String(avail.notes || avail.note || avail.comment || '').trim();
          const shouldCollapseNotes = notesText.length > 120 || notesText.includes('\n');
          const availabilityColor = resolveAvailabilityColor(avail);
          const displayNumber = Number.isFinite(Number(avail.availabilityNumber))
            ? Number(avail.availabilityNumber)
            : (Number.isFinite(Number(avail.id)) ? Number(avail.id) : index + 1);

          return (
            <div
              key={avail.id}
              className={`time-schedule-list-item ${availType}`}
              style={{ '--availability-color': availabilityColor }}
            >
              <div className="time-schedule-list-item-header">
                <div className="time-schedule-list-item-employee">
                  <div className="time-schedule-list-item-number" aria-label={`Disponibilidad ${displayNumber}`}>
                    #{displayNumber}
                  </div>
                  <div className="time-schedule-list-item-avatar">
                    {employeeName.charAt(0).toUpperCase()}
                  </div>
                  <div className="time-schedule-list-item-info">
                    <div className="time-schedule-list-item-name">{employeeName}</div>
                    <div className="time-schedule-list-item-role">{employeePosition}</div>
                  </div>
                </div>
                <span
                  className={`time-schedule-list-item-badge ${availType}`}
                  style={{
                    backgroundColor: toRgba(availabilityColor, 0.12),
                    color: availabilityColor,
                    border: `1px solid ${toRgba(availabilityColor, 0.25)}`
                  }}
                >
                  {availType === 'available' ? (
                    <>
                      <MdCheckCircle size={14} />
                      DISPONIBLE
                    </>
                  ) : (
                    <>
                      <MdCancel size={14} />
                      NO DISPONIBLE
                    </>
                  )}
                </span>
              </div>

              {/* DOS COLUMNAS: Fecha | Horario */}
              {/*            Duración | Área       */}
              <div className="time-schedule-list-item-details">
                {/* Columna 1: Fecha */}
                <div className="time-schedule-list-item-detail">
                  <MdCalendarToday className="time-schedule-list-item-detail-icon" />
                  <div className="time-schedule-list-item-detail-content">
                    <div className="time-schedule-list-item-detail-label">FECHA</div>
                    <div className="time-schedule-list-item-detail-value">{formatDate(avail.date)}</div>
                  </div>
                </div>

                {/* Columna 2: Horario */}
                <div className="time-schedule-list-item-detail">
                  <MdAccessTime className="time-schedule-list-item-detail-icon" />
                  <div className="time-schedule-list-item-detail-content">
                    <div className="time-schedule-list-item-detail-label">HORARIO</div>
                    <div className="time-schedule-list-item-detail-value">{formatTime(startTime, endTime)}</div>
                  </div>
                </div>

                {/* Columna 3: Duración (primera de la segunda fila) */}
                <div className="time-schedule-list-item-detail">
                  <MdTimer className="time-schedule-list-item-detail-icon" />
                  <div className="time-schedule-list-item-detail-content">
                    <div className="time-schedule-list-item-detail-label">DURACIÓN</div>
                    <div className="time-schedule-list-item-detail-value">{calculateDuration(startTime, endTime)}</div>
                  </div>
                </div>

                {/* Columna 4: Área (segunda de la segunda fila) */}
                <div className="time-schedule-list-item-detail">
                  <MdBusiness className="time-schedule-list-item-detail-icon" />
                  <div className="time-schedule-list-item-detail-content">
                    <div className="time-schedule-list-item-detail-label">ÁREA</div>
                    <div className="time-schedule-list-item-detail-value">{employeeArea}</div>
                  </div>
                </div>
              </div>

              {notesText && (
                <div className="time-schedule-list-item-notes">
                  <div className="time-schedule-list-item-notes-label">NOTAS</div>
                  <div
                    className={`time-schedule-list-item-notes-content ${shouldCollapseNotes && !expandedNotes[avail.id] ? 'collapsed' : ''}`}
                  >
                    {notesText}
                  </div>
                  {shouldCollapseNotes && (
                    <button
                      type="button"
                      className="time-schedule-list-item-notes-toggle"
                      onClick={() => toggleNotes(avail.id)}
                    >
                      {expandedNotes[avail.id] ? 'Ver menos' : 'Ver más'}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimeScheduleList;