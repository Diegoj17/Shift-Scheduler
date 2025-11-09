import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../../styles/components/time/admin/TimeScheduleDetails.css';
import { MdClose, MdCalendarToday, MdPerson, MdInsertChart, MdCheckCircle, MdCancel } from 'react-icons/md';

const TimeScheduleDetails = ({ availability, onClose }) => {
  useEffect(() => {
    // Prevenir scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const navigate = useNavigate();

  if (!availability) return null;

  // Normalizar campos (acepta snake_case y camelCase que vienen de diferentes fuentes)
  const employeeName = availability.employee_name || availability.employeeName || availability.employee || availability.name || '';
  const role = availability.employee_position || availability.role || availability.position || availability.puesto || '';
  const area = availability.employee_area || availability.area || availability.department || '';
  const rawDate = availability.date || availability.day || availability.fecha || '';
  const rawStartTime = availability.start_time || availability.startTime || availability.start || availability.hora_inicio || '';
  const rawEndTime = availability.end_time || availability.endTime || availability.end || availability.hora_fin || '';

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (startTime, endTime) => {
    const to12 = (t) => {
      if (!t) return '';
      // Aceptar 'HH:MM:SS' o 'HH:MM'
      const [hhStr, mmStr] = String(t).split(':');
      const hh = Number(hhStr) || 0;
      const mm = Number(mmStr) || 0;
      const period = hh >= 12 ? 'p. m.' : 'a. m.';
      const h12 = hh % 12 === 0 ? 12 : hh % 12;
      return `${h12}:${String(mm).padStart(2, '0')} ${period}`;
    };
    return `${to12(startTime)} - ${to12(endTime)}`;
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '';
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    // Si termina antes de empezar, asumir que cruza medianoche y sumar 1 día al end
    let diff = end - start;
    if (diff <= 0) {
      const endNext = new Date(`2000-01-02T${endTime}`);
      diff = endNext - start;
    }
    const hours = Math.round((diff / (1000 * 60 * 60)) * 10) / 10;
    return `${hours}h`;
  };
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  const handleAssignAndNavigate = () => {
    // Construir objeto de prefill que CalendarPage/ShiftModal puede entender
    const date = rawDate;
    const startTime = rawStartTime;
    const endTime = rawEndTime;

    const startIso = date && startTime ? `${date}T${startTime}` : null;
    const endIso = date && endTime ? `${date}T${endTime}` : null;

    const prefillShift = {
      id: null,
      employeeId: availability.employee_id, 
      employee: availability.employee_id,
      employeeName: employeeName,
      shiftTypeId: null,
      start: startIso,
      end: endIso,
      date: date,
      start_time: startTime,
      end_time: endTime,
      role: role,
      notes: ''
    };

    // Navegar al calendario y pasar el prefill como state
    navigate('/admin/calendar', { state: { openShiftModal: true, prefillShift } });
  };

  return (
    <div className="time-schedule-details-overlay" onClick={handleBackdropClick}>
      <div className="time-schedule-details-modal">
        <div className="time-schedule-details-header">
          <div className="time-schedule-details-header-content">
            <div className={`time-schedule-details-status ${availability.type}`}>
              {availability.type === 'available' ? '✓ Disponible' : '✕ No disponible'}
            </div>
            <h2 className="time-schedule-details-title">{employeeName}</h2>
            <p className="time-schedule-details-subtitle">{role} - {area}</p>
          </div>
          <button className="time-schedule-details-close" onClick={onClose}>
            <MdClose />
          </button>
        </div>

        <div className="time-schedule-details-body">

          <div className="time-schedule-details-section">
            <h3 className="time-schedule-details-section-title">
              <MdCalendarToday style={{ marginRight: 8 }} /> Información de Fecha y Horario
            </h3>
            <div className="time-schedule-details-grid">
              <div className="time-schedule-details-field">
                <div className="time-schedule-details-label">Fecha</div>
                <div className="time-schedule-details-value">{formatDate(rawDate)}</div>
              </div>

              <div className="time-schedule-details-field">
                <div className="time-schedule-details-label">Horas</div>
                <div className="time-schedule-details-value">{formatTime(rawStartTime, rawEndTime)}</div>
              </div>

              <div className="time-schedule-details-field">
                <div className="time-schedule-details-label">Duración</div>
                <div className="time-schedule-details-value">{calculateDuration(rawStartTime, rawEndTime)}</div>
              </div>
            </div>
          </div>

          <div className="time-schedule-details-section">
            <h3 className="time-schedule-details-section-title">
              <MdPerson style={{ marginRight: 8 }} /> Información del Empleado
            </h3>
            <div className="time-schedule-details-grid">
              <div className="time-schedule-details-field">
                <div className="time-schedule-details-label">Nombre completo</div>
                <div className="time-schedule-details-value">{employeeName}</div>
              </div>
              <div className="time-schedule-details-field">
                <div className="time-schedule-details-label">Puesto</div>
                <div className="time-schedule-details-value">{role}</div>
              </div>
              <div className="time-schedule-details-field">
                <div className="time-schedule-details-label">Departamento</div>
                <div className="time-schedule-details-value">{area}</div>
              </div>
            </div>
          </div>

          <div className="time-schedule-details-section">
            <h3 className="time-schedule-details-section-title">
              <MdInsertChart style={{ marginRight: 8 }} /> Estado de Disponibilidad
            </h3>
            <div className={`time-schedule-details-availability-card ${availability.type}`}>
              <div className="time-schedule-details-availability-icon">
                {availability.type === 'available' ? <MdCheckCircle /> : <MdCancel />}
              </div>
              <div>
                <div className="time-schedule-details-availability-status">
                  {availability.type === 'available' ? 'Disponible para asignación' : 'No disponible'}
                </div>
                <div className="time-schedule-details-availability-description">
                  {availability.type === 'available' 
                    ? 'Este empleado puede ser asignado a un turno en este horario'
                    : 'Este empleado no está disponible para turnos en este horario'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="time-schedule-details-footer">
          <button className="time-schedule-details-button secondary" onClick={onClose}>
            Cerrar
          </button>
          {availability.type === 'available' && (
            <button className="time-schedule-details-button primary" onClick={handleAssignAndNavigate}>
              Asignar Turno
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimeScheduleDetails;