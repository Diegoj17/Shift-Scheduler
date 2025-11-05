import React, { useEffect, useState } from 'react';
import { FaClock, FaEye, FaEdit } from 'react-icons/fa';
import '../../../styles/components/dashboard/admin/UpcomingShifts.css';
import { shiftService } from '../../../services/shiftService';

const UpcomingShifts = () => {
  const [upcomingShifts, setUpcomingShifts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        setLoading(true);
        const shifts = await shiftService.getShiftsForCalendar();
        if (!mounted) return;
        // Ordenar por fecha de inicio y tomar los próximos N
        const sorted = (shifts || []).slice().sort((a,b) => new Date(a.start) - new Date(b.start));
        const next = sorted.slice(0, 6).map((s, idx) => ({
          id: s.id || idx,
          name: s.extendedProps?.employeeName || s.title || 'Sin nombre',
          time: s.start && s.end ? `${new Date(s.start).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} - ${new Date(s.end).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}` : '',
          role: s.extendedProps?.role || '',
          status: 'active',
          statusLabel: 'Activo'
        }));

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
            
            <div className="shift-details">
              <h4>{shift.name}</h4>
              <p>
                <span className="shift-time">{shift.time}</span>
                <span className="shift-role">{shift.role}</span>
              </p>
            </div>
            
            <div className="shift-controls">
              <div className="shift-actions">
                <button className="shift-action-btn" title="Ver detalles">
                  <FaEye />
                </button>
                <button className="shift-action-btn" title="Editar turno">
                  <FaEdit />
                </button>
              </div>

              <div 
                className={`shift-status ${shift.status}`} 
                data-status={shift.statusLabel}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingShifts;