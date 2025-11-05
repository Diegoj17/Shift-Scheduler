import React, { useEffect, useState } from 'react';
import { FaClock, FaMapMarkerAlt, FaPhone, FaEdit, FaTrash } from 'react-icons/fa';
import '../../../styles/components/dashboard/admin/DayShift.css';
import { shiftService } from '../../../services/shiftService';

const DayShift = ({ filtroArea, searchTerm = '' }) => {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      try {
        setLoading(true);
        const shifts = await shiftService.getShiftsForCalendar();
        if (!mounted) return;
        // Filtrar turnos para hoy
        const today = new Date().toISOString().slice(0, 10);
        const todays = (shifts || []).filter(s => {
          try {
            const datePart = (s.start && s.start.split && s.start.split('T')[0]) || (s.start && new Date(s.start).toISOString().slice(0,10));
            return datePart === today;
          } catch {
            return false;
          }
        }).map((s, idx) => ({
          id: s.id || idx,
          empleado: s.extendedProps?.employeeName || s.title || 'Sin nombre',
          horario: s.start && s.end ? `${new Date(s.start).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} - ${new Date(s.end).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}` : '',
          estado: 'activo',
          area: s.extendedProps?.role || '',
          telefono: ''
        }));

        setTurnos(todays);
      } catch (err) {
        console.error('Error cargando turnos del día:', err);
        setTurnos([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => { mounted = false; };
  }, []);

  const getInitials = (nombre) => {
    return (nombre || '').split(' ').map(n => n[0]).join('');
  };

  const search = (searchTerm || '').toLowerCase();

  const turnosFiltrados = turnos.filter(turno => {
    const matchArea = !filtroArea || filtroArea === 'todas' || turno.area === filtroArea;
    const empleado = (turno.empleado || '').toLowerCase();
    const matchSearch = empleado.includes(search);
    return matchArea && matchSearch;
  });

  return (
    <div className="turnos-del-dia">
      <div className="card-header">
        <h2 className="card-title">
          <FaClock className="title-icon" />
          Turnos del Día ({loading ? '...' : turnosFiltrados.length})
        </h2>
        <div className="status-legend">
          <span className="legend-item activo">Activo</span>
          <span className="legend-item pendiente">Pendiente</span>
          <span className="legend-item ausente">Ausente</span>
        </div>
      </div>

      <div className="turnos-list">
        {loading && <div style={{padding:16}}>Cargando turnos...</div>}
        {!loading && turnosFiltrados.length === 0 && <div style={{padding:16, color:'#777'}}>No hay turnos programados para hoy</div>}
        {turnosFiltrados.map(turno => (
          <div key={turno.id} className="turno-card">
            <div className="turno-content">
              <div className="empleado-info">
                <div className="avatar-large">
                  {getInitials(turno.empleado)}
                </div>
                <div className="empleado-details">
                  <h3 className="empleado-nombre">{turno.empleado}</h3>
                  <div className="empleado-meta">
                    <span className="meta-item">
                      <FaMapMarkerAlt /> {turno.area}
                    </span>
                    <span className="meta-item">
                      <FaPhone /> {turno.telefono}
                    </span>
                  </div>
                </div>
              </div>

              <div className="turno-info">
                <div className="horario-info">
                  <p className="turno-tipo">{turno.area || '—'}</p>
                  <p className="turno-horario">{turno.horario}</p>
                </div>
                <div className={`status-indicator ${turno.estado}`}></div>
                <div className="turno-actions">
                  <button className="action-btn edit-btn">
                    <FaEdit />
                  </button>
                  <button className="action-btn delete-btn">
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DayShift;