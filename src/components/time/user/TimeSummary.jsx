import React from 'react';
import { MdAccessTime, MdCalendarToday, MdFlashOn } from 'react-icons/md';
import { formatTime } from '../../../utils/dateUtils';
import '../../../styles/components/time/user/TimeSummary.css';

const TimeSummary = ({ shiftData }) => {
  // ✅ FORMATO DE FECHA MEJORADO
  const formatDateLong = () => {
    try {
      const today = new Date();
      return today.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return new Date().toLocaleDateString('es-ES');
    }
  };

  // ✅ DETERMINAR ESTADO DEL DÍA - LÓGICA MEJORADA
  const getDayStatus = () => {
    // ✅ PRIMERO: Si no hay turnos para hoy
    if (!shiftData.hasShiftsForToday) {
      return {
        text: 'Sin turno',
        class: 'time-summary-status-inactive'
      };
    }

    // ✅ SEGUNDO: Si hay turnos pero ya completó la jornada
    if (shiftData.exitRegistered && shiftData.entryRegistered) {
      return {
        text: 'Jornada Completa',
        class: 'time-summary-status-completed'
      };
    } 
    // ✅ TERCERO: Si registró entrada pero no salida
    else if (shiftData.entryRegistered) {
      return {
        text: 'En Turno',
        class: 'time-summary-status-active'
      };
    } 
    // ✅ CUARTO: Si tiene turno activo pendiente
    else if (shiftData.hasActiveShift) {
      return {
        text: 'Pendiente',
        class: 'time-summary-status-pending'
      };
    } 
    // ✅ QUINTO: Caso por defecto (no debería ocurrir)
    else {
      return {
        text: 'Sin turno',
        class: 'time-summary-status-inactive'
      };
    }
  };

  // ✅ OBTENER INFORMACIÓN DEL TURNO - LIMPIAR CUANDO NO HAY
  const getShiftTypeInfo = () => {
    // ✅ CRÍTICO: Si no hay turnos para hoy, limpiar toda la información
    if (!shiftData.hasShiftsForToday) {
      return {
        name: 'Sin turno',
        color: null
      };
    }

    // ✅ Si hay turnos, mostrar la información normal
    const name = shiftData.shiftTypeName || 'Jornada completa';
    const color = null; // O puedes obtenerlo de shiftData.currentShift si lo necesitas

    return { name, color };
  };

  // ✅ OBTENER HORARIO - LIMPIAR CUANDO NO HAY TURNOS
  const getSchedule = () => {
    if (!shiftData.hasShiftsForToday) {
      return '-';
    }
    
    const formatTimeForDisplay = (time) => {
      if (!time || time === '--:--') return '-';
      return formatTime(time);
    };
    
    const start = formatTimeForDisplay(shiftData.shiftStart);
    const end = formatTimeForDisplay(shiftData.shiftEnd);
    
    return start !== '-' && end !== '-' ? `${start} - ${end}` : '-';
  };

  const statusInfo = getDayStatus();

  return (
    <div className="time-summary-grid">
      {/* Card 1: Tipo de Turno */}
      <div className="time-summary-card time-summary-card-hours">
        <div className="time-summary-icon-wrapper" aria-hidden="true">
          <MdAccessTime size={20} />
        </div>
        <div className="time-summary-label">TURNO</div>
        <div className="time-summary-value">
          {(() => {
            const info = getShiftTypeInfo();
            return (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                {info.color && (
                  <span style={{ 
                    width: 10, 
                    height: 10, 
                    borderRadius: 6, 
                    backgroundColor: info.color, 
                    display: 'inline-block' 
                  }} />
                )}
                <span>{info.name}</span>
              </span>
            );
          })()}
        </div>
      </div>

      {/* Card 2: Estado */}
      <div className="time-summary-card time-summary-card-overtime">
        <div className="time-summary-icon-wrapper" aria-hidden="true">
          <MdFlashOn size={20} />
        </div>
        <div className="time-summary-label">ESTADO</div>
        <div className={`time-summary-value ${statusInfo.class}`}>
          {statusInfo.text}
        </div>
      </div>

      {/* Card 3: Día Actual */}
      <div className="time-summary-card time-summary-card-day">
        <div className="time-summary-icon-wrapper" aria-hidden="true">
          <MdCalendarToday size={20} />
        </div>
        <div className="time-summary-label">DÍA</div>
        <div className="time-summary-value">{formatDateLong()}</div>
      </div>

      {/* Card 4: Horario - SOLO SI HAY TURNOS */}
      <div className="time-summary-card time-summary-card-days">
        <div className="time-summary-icon-wrapper" aria-hidden="true">
          <MdCalendarToday size={20} />
        </div>
        <div className="time-summary-label">HORARIO</div>
        <div className="time-summary-value">{getSchedule()}</div>
      </div>
    </div>
  );
};

export default TimeSummary;