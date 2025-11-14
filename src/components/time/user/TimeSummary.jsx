import React from 'react';
import { MdAccessTime, MdCalendarToday, MdFlashOn } from 'react-icons/md';
import '../../../styles/components/time/user/TimeSummary.css';

const TimeSummary = ({ shiftData }) => {
  const formatTime12 = (timeInput) => {
    if (!timeInput) return '-';
    // Accepts 'HH:MM', 'HH:MM:SS', ISO string or Date
    try {
      let t = timeInput;
      if (t instanceof Date) {
        const hh = t.getHours();
        const mm = t.getMinutes();
        const period = hh >= 12 ? 'p. m.' : 'a. m.';
        const h12 = hh % 12 === 0 ? 12 : hh % 12;
        return `${h12}:${String(mm).padStart(2, '0')} ${period}`;
      }

      const s = String(t);
      // If ISO datetime, get time part
      if (s.includes('T')) {
        const parts = s.split('T');
        t = parts[1];
      }

      const [hhStr, mmStr] = String(t).split(':');
      const hh = Number(hhStr);
      const mm = Number(mmStr) || 0;
      if (isNaN(hh)) return '-';
      const period = hh >= 12 ? 'p. m.' : 'a. m.';
      const h12 = hh % 12 === 0 ? 12 : hh % 12;
      return `${h12}:${String(mm).padStart(2, '0')} ${period}`;
    } catch {
      return '-';
    }
  };
  const formatDateLong = (dateInput) => {
    if (!dateInput) return '-';
    try {
      let d = dateInput;
      if (typeof d === 'string' && d.includes('T')) d = d.split('T')[0];
      const date = d instanceof Date ? d : new Date(d);
      if (isNaN(date)) return '-';
      return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    } catch {
      return '-';
    }
  };
  // ✅ Determinar estado del día
  const getDayStatus = () => {
    if (shiftData.exitRegistered && shiftData.entryRegistered) {
      return {
        text: 'Jornada Completa',
        class: 'time-summary-status-completed'
      };
    } else if (shiftData.entryRegistered) {
      return {
        text: 'En Turno',
        class: 'time-summary-status-active'
      };
    } else if (shiftData.hasActiveShift) {
      return {
        text: 'Pendiente',
        class: 'time-summary-status-pending'
      };
    } else {
      return {
        text: 'Sin Turno',
        class: 'time-summary-status-inactive'
      };
    }
  };

  // Obtener nombre y color del tipo de turno desde varios posibles campos
  const getShiftTypeInfo = () => {
    const s = shiftData || {};
    const nested = s.shift || s.shiftData || {};

    const name = s.shiftTypeName || s.shiftType || s.typeName || nested.shiftTypeName || nested.shift_type_name || nested.shift_type || (nested.shiftType && nested.shiftType.name) || (s.shiftType && s.shiftType.name) || '-';

    const color = s.shiftTypeColor || s.color || nested.backgroundColor || nested.color || (nested.shiftType && nested.shiftType.color) || (s.shiftType && s.shiftType.color) || null;

    return { name, color };
  };

  

  return (
    <div className="time-summary-grid">
      <div className="time-summary-card time-summary-card-hours">
        <div className="time-summary-icon-wrapper" aria-hidden="true">
          <MdAccessTime size={20} />
        </div>
          <div className="time-summary-label">Turno</div>
          <div className="time-summary-value">
            {(() => {
              const info = getShiftTypeInfo();
              return (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  {info.color ? (
                    <span style={{ width: 10, height: 10, borderRadius: 6, backgroundColor: info.color, display: 'inline-block' }} />
                  ) : null}
                  <span>{info.name}</span>
                </span>
              );
            })()}
          </div>
      </div>

      <div className="time-summary-card time-summary-card-day">
        <div className="time-summary-icon-wrapper" aria-hidden="true">
          <MdCalendarToday size={20} />
        </div>
        <div className="time-summary-label">Día</div>
        <div className="time-summary-value">{formatDateLong(shiftData.date || shiftData.start || shiftData.shiftDate || shiftData.shift?.date)}</div>
      </div>

      <div className="time-summary-card time-summary-card-days">
        <div className="time-summary-icon-wrapper" aria-hidden="true">
          <MdCalendarToday size={20} />
        </div>
        <div className="time-summary-label">Horario</div>
        <div className="time-summary-value">{formatTime12(shiftData.shiftStart)} - {formatTime12(shiftData.shiftEnd)}</div>
      </div>

      <div className="time-summary-card time-summary-card-overtime">
        <div className="time-summary-icon-wrapper" aria-hidden="true">
          <MdFlashOn size={20} />
        </div>
        <div className="time-summary-label">Estado</div>
        <div className="time-summary-value">{getDayStatus().text}</div>
      </div>
    </div>
  );
};

export default TimeSummary;