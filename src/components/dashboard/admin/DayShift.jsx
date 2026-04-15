import React, { useEffect, useState } from 'react';
import { FaClock, FaMapMarkerAlt, FaPhone, FaEdit, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../../../styles/components/dashboard/admin/DayShift.css';
import { shiftService } from '../../../services/shiftService';

const DayShift = ({ filtroArea, searchTerm = '' }) => {
  const [turnos, setTurnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estadoFiltro, setEstadoFiltro] = useState('todas');
  const navigate = useNavigate();

  const getShiftCategoryByHour = (startDate) => {
    if (!startDate) return 'Noche';
    const hour = new Date(startDate).getHours();
    if (hour >= 6 && hour < 12) return 'Mañana';
    if (hour >= 12 && hour < 18) return 'Tarde';
    return 'Noche';
  };

  const fallbackColorByCategory = (category) => {
    if (category === 'Mañana') return '#22c55e';
    if (category === 'Tarde') return '#3b82f6';
    return '#ef4444';
  };

  const normalizeColor = (value, fallback) => {
    const color = String(value || '').trim();
    if (!color) return fallback;
    if (/^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8}))$/.test(color)) return color;
    if (/^(rgb|rgba|hsl|hsla)\(/.test(color)) return color;
    return fallback;
  };

  const resolveShiftTypeColor = (shift) => {
    const category = getShiftCategoryByHour(shift.start);
    const fallback = fallbackColorByCategory(category);
    return normalizeColor(shift.backgroundColor || shift.extendedProps?.color, fallback);
  };

  const getEstadoDesdeBackend = (raw) => {
    const v = String(raw || '').toLowerCase();
    if (['active', 'activo', 'activa', 'en_curso', 'in_progress'].includes(v)) {
      return { status: 'activo', label: 'Activo' };
    }
    if (['pending', 'pendiente', 'scheduled', 'programado'].includes(v)) {
      return { status: 'pendiente', label: 'Pendiente' };
    }
    if (['absent', 'ausente', 'missed', 'cancelled', 'canceled'].includes(v)) {
      return { status: 'ausente', label: 'Ausente' };
    }
    return null;
  };

  const deriveEstado = (start, end) => {
    try {
      const now = new Date();
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (now < startDate) return { status: 'pendiente', label: 'Pendiente' };
      if (now > endDate) return { status: 'ausente', label: 'Ausente' };
      return { status: 'activo', label: 'Activo' };
    } catch {
      return { status: 'activo', label: 'Activo' };
    }
  };

  const formatTimeRange = (start, end) => {
    if (!start || !end) return '';
    const fmt = { hour: '2-digit', minute: '2-digit' };
    return `${new Date(start).toLocaleTimeString([], fmt)} - ${new Date(end).toLocaleTimeString([], fmt)}`;
  };

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
        }).map((s, idx) => {
          const backendEstado = getEstadoDesdeBackend(s.extendedProps?.status || s.status || s.extendedProps?.attendance_status);
          const estado = backendEstado || deriveEstado(s.start, s.end);
          return {
            id: s.id || idx,
            empleado: s.extendedProps?.employeeName || s.title || 'Sin nombre',
            horario: formatTimeRange(s.start, s.end),
            estado: estado.status,
            estadoLabel: estado.label,
            area: s.extendedProps?.role || '',
            telefono: s.extendedProps?.phone || '',
            start: s.start,
            end: s.end,
            shiftTypeId: s.extendedProps?.shiftTypeId || '',
            shiftTypeName: s.extendedProps?.shiftTypeName || '',
            notes: s.extendedProps?.notes || '',
            backgroundColor: s.backgroundColor || s.extendedProps?.color || '#667eea',
            shiftColor: resolveShiftTypeColor(s)
          };
        });

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
    const matchEstado = estadoFiltro === 'todas' || turno.estado === estadoFiltro;
    return matchArea && matchSearch && matchEstado;
  });

  const totalTurnosLabel = loading ? '...' : String(turnosFiltrados.length);

  const handleEditTurno = (turno) => {
    navigate('/admin/calendar', {
      state: {
        openShiftModal: true,
        prefillShift: {
          id: turno.id,
          employeeName: turno.empleado,
          start: turno.start,
          end: turno.end,
          shiftTypeId: turno.shiftTypeId,
          shiftTypeName: turno.shiftTypeName,
          role: turno.area,
          notes: turno.notes,
          backgroundColor: turno.backgroundColor,
        },
      },
    });
  };

  const requestDeleteTurno = (turno) => {
    navigate('/admin/calendar', {
      state: {
        openShiftModal: true,
        openShiftDeleteConfirm: true,
        prefillShift: {
          id: turno.id,
          employeeName: turno.empleado,
          start: turno.start,
          end: turno.end,
          shiftTypeId: turno.shiftTypeId,
          shiftTypeName: turno.shiftTypeName,
          role: turno.area,
          notes: turno.notes,
          backgroundColor: turno.backgroundColor,
        },
      },
    });
  };

  return (
    <div className="turnos-del-dia">
      <div className="card-header">
        <h2 className="card-title">
          <span className="title-accent" aria-hidden="true"></span>
          <FaClock className="title-icon" />
          {`Turnos del Día (${totalTurnosLabel})`}
        </h2>
        <div className="status-legend">
          <button className={`legend-item activo ${estadoFiltro === 'activo' ? 'active' : ''}`} onClick={() => setEstadoFiltro('activo')}>Activo</button>
          <button className={`legend-item pendiente ${estadoFiltro === 'pendiente' ? 'active' : ''}`} onClick={() => setEstadoFiltro('pendiente')}>Pendiente</button>
          <button className={`legend-item ausente ${estadoFiltro === 'ausente' ? 'active' : ''}`} onClick={() => setEstadoFiltro('ausente')}>Ausente</button>
          <button className={`legend-item ${estadoFiltro === 'todas' ? 'active neutral' : 'neutral'}`} onClick={() => setEstadoFiltro('todas')}>Todas</button>
        </div>
      </div>

      <div className="turnos-list">
        {loading && <div style={{padding:16}}>Cargando turnos...</div>}
        {!loading && turnosFiltrados.length === 0 && <div style={{padding:16, color:'#777'}}>No hay turnos programados para hoy</div>}
        {turnosFiltrados.map(turno => (
          <div
            key={turno.id}
            className="turno-card"
            style={{ '--shift-color': turno.shiftColor }}
          >
            <div className="turno-content">
              <div className="empleado-info">
                <div className="avatar-large" style={{ '--shift-color': turno.shiftColor }}>
                  {getInitials(turno.empleado)}
                </div>
                <div className="empleado-details">
                  <h3 className="empleado-nombre">{turno.empleado}</h3>
                  <div className="empleado-meta">
                    <span className="meta-item">
                      <FaMapMarkerAlt /> {turno.area}
                    </span>
                    {turno.telefono ? (
                      <span className="meta-item">
                        <FaPhone /> {turno.telefono}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="turno-info">
                <div className="horario-info">
                  <p className="turno-tipo">{turno.area || '—'}</p>
                  <p className="turno-horario">{turno.horario}</p>
                </div>
                <div className="status-wrap">
                  <div className={`status-indicator ${turno.estado}`}></div>
                  <span className={`status-pill ${turno.estado}`}>{turno.estadoLabel}</span>
                </div>
                <div className="turno-actions">
                  <button className="action-btn edit-btn" onClick={() => handleEditTurno(turno)} title="Editar turno" aria-label="Editar turno">
                    <FaEdit />
                  </button>
                  <button className="action-btn delete-btn" onClick={() => requestDeleteTurno(turno)} title="Eliminar turno" aria-label="Eliminar turno">
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
