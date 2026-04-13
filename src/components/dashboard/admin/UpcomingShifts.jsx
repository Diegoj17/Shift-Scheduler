import React, { useEffect, useState } from 'react';
import { FaClock, FaEye, FaEdit } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../../../styles/components/dashboard/admin/UpcomingShifts.css';
import { shiftService } from '../../../services/shiftService';

const UpcomingShifts = () => {
  const [upcomingShifts, setUpcomingShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const getStatusFromBackend = (raw) => {
    const v = String(raw || '').toLowerCase();
    if (['active', 'activo', 'activa', 'in_progress', 'en_curso'].includes(v)) {
      return { status: 'active', statusLabel: 'Activo' };
    }
    if (['pending', 'pendiente', 'scheduled', 'programado'].includes(v)) {
      return { status: 'pending', statusLabel: 'Pendiente' };
    }
    if (['absent', 'ausente', 'cancelled', 'canceled', 'missed'].includes(v)) {
      return { status: 'cancelled', statusLabel: 'Ausente' };
    }
    return null;
  };

  const deriveStatus = (start, end) => {
    try {
      const now = new Date();
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (now < startDate) return { status: 'pending', statusLabel: 'Pendiente' };
      if (now > endDate) return { status: 'cancelled', statusLabel: 'Ausente' };
      return { status: 'active', statusLabel: 'Activo' };
    } catch {
      return { status: 'active', statusLabel: 'Activo' };
    }
  };

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        setLoading(true);
        const shifts = await shiftService.getShiftsForCalendar();
        if (!mounted) return;
        const now = new Date();
        // Mantener solo turnos vigentes o futuros (evitar ruido de ausentes antiguos)
        const sorted = (shifts || [])
          .filter((s) => {
            try {
              return new Date(s.end) >= now;
            } catch {
              return false;
            }
          })
          .slice()
          .sort((a,b) => new Date(a.start) - new Date(b.start));

        const next = sorted.slice(0, 6).map((s, idx) => {
          const statusData = getStatusFromBackend(s.extendedProps?.status || s.status || s.extendedProps?.attendance_status) || deriveStatus(s.start, s.end);
          return {
            id: s.id || idx,
            name: s.extendedProps?.employeeName || s.title || 'Sin nombre',
            time: s.start && s.end ? `${new Date(s.start).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} - ${new Date(s.end).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}` : '',
            role: s.extendedProps?.role || '',
            status: statusData.status,
            statusLabel: statusData.statusLabel,
            start: s.start,
            end: s.end,
            shiftTypeId: s.extendedProps?.shiftTypeId || '',
            shiftTypeName: s.extendedProps?.shiftTypeName || '',
            notes: s.extendedProps?.notes || '',
            backgroundColor: s.backgroundColor || s.extendedProps?.color || '#667eea'
          };
        });

        setUpcomingShifts(next);
      } catch (err) {
        console.error('Error cargando próximos turnos:', err);
        setUpcomingShifts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => { mounted = false; };
  }, []);

  const getInitials = (name) => {
    return (name || '').split(' ').map(n => n[0]).join('');
  };

  const openShiftInCalendar = (shift) => {
    navigate('/admin/calendar', {
      state: {
        openShiftModal: true,
        prefillShift: {
          id: shift.id,
          employeeName: shift.name,
          start: shift.start,
          end: shift.end,
          shiftTypeId: shift.shiftTypeId,
          shiftTypeName: shift.shiftTypeName,
          role: shift.role,
          notes: shift.notes,
          backgroundColor: shift.backgroundColor,
        },
      },
    });
  };

  return (
    <div className="upcoming-shifts">
      <div className="widget-header">
        <h3 className="widget-title">
          <FaClock className="title-icon" />
          Próximos Turnos
        </h3>
      </div>
      
      <div className="shifts-list">
        {loading && <div style={{padding:12}}>Cargando próximos turnos...</div>}
        {!loading && upcomingShifts.length === 0 && <div style={{padding:12, color:'#777'}}>No hay próximos turnos programados</div>}
        {upcomingShifts.map((shift) => (
          <div key={shift.id} className="shift-item">
            <div className="shift-avatar">
              {getInitials(shift.name)}
            </div>
            
            <div className="upcoming-shift-details">
              <h4>{shift.name}</h4>
              <p>
                <span className="shift-time">{shift.time}</span>
                <span className="shift-role">{shift.role}</span>
              </p>
            </div>
            
            <div className="shift-controls">
              <div className="shift-actions">
                <button className="shift-action-btn" title="Ver detalles" aria-label="Ver detalles" onClick={() => openShiftInCalendar(shift)}>
                  <FaEye />
                </button>
                <button className="shift-action-btn" title="Editar turno" aria-label="Editar turno" onClick={() => openShiftInCalendar(shift)}>
                  <FaEdit />
                </button>
              </div>

              <div className="shift-status-wrap">
                <div className={`shift-status ${shift.status}`}></div>
                <span className={`shift-status-label ${shift.status}`}>{shift.statusLabel}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingShifts;
