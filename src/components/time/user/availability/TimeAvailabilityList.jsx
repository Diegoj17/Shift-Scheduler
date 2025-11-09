import React, { useState } from 'react';
import { MdListAlt, MdDelete, MdCalendarToday, MdSchedule, MdCheck, MdClose, MdList, MdCheckCircle, MdCancel } from 'react-icons/md';
import ConfirmModal from '../../../common/ConfirmModal';
import '../../../../styles/components/time/user/availability/TimeAvailabilityList.css';

const TimeAvailabilityList = ({ availabilities, onDelete }) => {
  const [sortBy, _setSortBy] = useState('date');
  const [filterType, setFilterType] = useState('all');

  const isAvailable = (avail) => {
    if (!avail) return false;
    // Check boolean flags first
    if (typeof avail.available === 'boolean') return avail.available;
    if (typeof avail.is_available === 'boolean') return avail.is_available;
    if (typeof avail.isAvailable === 'boolean') return avail.isAvailable;

    // Normalize type/value fields to string and compare commonly used values
    const raw = (avail.type || avail.status || avail.value || '').toString().trim().toLowerCase();
    if (!raw) {
      // sometimes backend uses numeric flags
      if (typeof avail.available === 'number') return avail.available === 1;
      if (typeof avail.is_available === 'number') return avail.is_available === 1;
      return false;
    }

    const truthy = ['available', 'disponible', 'true', '1', 'si', 'sí', 'yes', 'y'];
    const falsy = ['unavailable', 'no disponible', 'false', '0', 'no', 'n', 'n/a', 'na', 'not available'];

    if (truthy.includes(raw)) return true;
    if (falsy.includes(raw)) return false;

    // as a last resort, treat unknowns as false
    return false;
  };

  const filteredAvailabilities = availabilities.filter(avail => {
    if (filterType === 'all') return true;
    if (filterType === 'available') return isAvailable(avail);
    if (filterType === 'unavailable') return !isAvailable(avail);
    return true;
  });

  const sortedAvailabilities = [...filteredAvailabilities].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(a.date) - new Date(b.date);
      case 'type':
        return a.type.localeCompare(b.type);
      default:
        return 0;
    }
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Sin fecha';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long',
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


  const handleDelete = (id) => {
    // Open confirm modal instead of native confirm
    setConfirm({ isOpen: true, id, message: '¿Estás seguro de que deseas eliminar esta disponibilidad?' });
  };

  // Confirm modal state
  const [confirm, setConfirm] = React.useState({ isOpen: false, id: null, message: '' });

  const handleConfirmCancel = () => {
    setConfirm({ isOpen: false, id: null, message: '' });
  };

  const handleConfirmDelete = () => {
    if (confirm.id) onDelete(confirm.id);
    setConfirm({ isOpen: false, id: null, message: '' });
  };

  if (!availabilities || availabilities.length === 0) {
    return (
      <div className="time-availability-list-section">
        <div className="time-availability-list-header">
          <div className="time-availability-list-icon">
            <MdList size={25} />
          </div>
          <div>
            <h2 className="time-availability-list-title">Historial de Disponibilidades</h2>
            <p className="time-availability-list-subtitle">No hay registros disponibles</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="time-availability-list-section">
      <div className="time-availability-list-header">
        <div>
          <h2 className="time-availability-list-title">Mis Disponibilidades</h2>
          <p className="time-availability-list-subtitle">
            {sortedAvailabilities.length} registro{sortedAvailabilities.length !== 1 ? 's' : ''} encontrado{sortedAvailabilities.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="time-availability-list-filters">
          <button 
            className={`time-availability-filter-btn ${filterType === 'all' ? 'active' : ''}`}
            onClick={() => setFilterType('all')}
          >
            Todos
          </button>
          <button 
            className={`time-availability-filter-btn ${filterType === 'available' ? 'active' : ''}`}
            onClick={() => setFilterType('available')}
          >
            Disponible
          </button>
          <button 
            className={`time-availability-filter-btn ${filterType === 'unavailable' ? 'active' : ''}`}
            onClick={() => setFilterType('unavailable')}
          >
            No disponible
          </button>
        </div>
      </div>

      {sortedAvailabilities.length === 0 ? (
        <div className="time-availability-empty-state">
          <div className="time-availability-empty-icon" aria-hidden="true"><MdListAlt size={28} /></div>
          <h3 className="time-availability-empty-title">No hay registros</h3>
          <p className="time-availability-empty-description">
            No se encontraron disponibilidades para el filtro seleccionado
          </p>
        </div>
      ) : (
        <div className="time-availability-list-grid">
          {sortedAvailabilities.map(avail => {

            const startTime = avail.start_time || avail.startTime || '00:00';
            const endTime = avail.end_time || avail.endTime || '00:00';
            const availType = avail.type || 'available';
            
            return (
            <div key={avail.id} className={`time-availability-list-item ${availType}`}>
              <div className="time-availability-list-item-header">
                <span className={`time-availability-list-badge ${availType}`}>
                  {availType === 'available' ? (
                    <><MdCheckCircle size={14} aria-hidden="true" /> <span>Disponible</span></>
                  ) : (
                    <><MdClose size={14} aria-hidden="true" /> <span>No disponible</span></>
                  )}
                </span>
                <button 
                  className="time-availability-list-delete"
                  onClick={() => handleDelete(avail.id)}
                  title="Eliminar"
                >
                  <MdCancel size={16} />
                </button>
              </div>
              
              <div className="time-availability-list-date">
                <span className="time-availability-list-date-icon" aria-hidden="true"><MdCalendarToday size={16} /></span>
                <span>{formatDate(avail.date)}</span>
              </div>
              
              <div className="time-availability-list-time">
                <span className="time-availability-list-time-icon" aria-hidden="true"><MdSchedule size={16} /></span>
                <span>{formatTime(startTime, endTime)}</span>
              </div>
              {avail.notes && (
                <div className="time-availability-list-item-notes">
                  <strong>Notas:</strong> {avail.notes}
                </div>
              )}
            </div>
          )})}
        </div>
      )}

      <ConfirmModal
        isOpen={confirm.isOpen}
        title="Confirmar eliminación"
        message={confirm.message}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onCancel={handleConfirmCancel}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default TimeAvailabilityList;