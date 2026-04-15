import React, { useEffect, useState } from 'react';
import { FaClock, FaEye, FaEdit } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import ShiftDetails from '../../calendar/user/ShiftDetails';
import '../../../styles/components/dashboard/admin/UpcomingShifts.css';
import { shiftService } from '../../../services/shiftService';

const UpcomingShifts = () => {
  const [upcomingShifts, setUpcomingShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [employees, setEmployees] = useState([]);
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
        const [shifts, employeesData] = await Promise.all([
          shiftService.getShiftsForCalendar(),
          shiftService.getEmployees()
        ]);

        if (!mounted) return;

        setEmployees(Array.isArray(employeesData) ? employeesData : []);
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
          const employeeId = s.extendedProps?.employeeId || s.employeeId || s.extendedProps?.employeeUserId || s.employeeUserId || s.extendedProps?.employee_id || s.employee_id || s.employee;
          const employeeRecord = (Array.isArray(employeesData) ? employeesData : []).find((emp) =>
            String(emp.id) === String(employeeId) || String(emp.employee_id) === String(employeeId)
          );
          const department = employeeRecord?.departamento || employeeRecord?.department || employeeRecord?.employee_area || employeeRecord?.area || s.extendedProps?.department || s.extendedProps?.area || 'Turnos';
          const location = s.extendedProps?.location || s.location || department || 'Principal';
          return {
            id: s.id || idx,
            name: s.extendedProps?.employeeName || s.title || 'Sin nombre',
            time: s.start && s.end ? `${new Date(s.start).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})} - ${new Date(s.end).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}` : '',
            role: s.extendedProps?.role || '',
            department,
            location,
            status: statusData.status,
            statusLabel: statusData.statusLabel,
            start: s.start,
            end: s.end,
            shiftTypeId: s.extendedProps?.shiftTypeId || '',
            shiftTypeName: s.extendedProps?.shiftTypeName || '',
            notes: s.extendedProps?.notes || '',
            backgroundColor: s.backgroundColor || s.extendedProps?.color || '#667eea',
            shiftColor: resolveShiftTypeColor(s),
            employeeDepartment: department
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

  const openShiftDetails = (shift) => {
    setSelectedShift({
      id: shift.id,
      title: `${shift.name}${shift.shiftTypeName ? ` - ${shift.shiftTypeName}` : ''}`,
      start: shift.start,
      end: shift.end,
      backgroundColor: shift.backgroundColor,
      role: shift.role || 'Supervisor de Turnos',
      department: shift.employeeDepartment || shift.department || 'Turnos',
      area: shift.employeeDepartment || shift.department || 'Turnos',
      userDepartment: shift.employeeDepartment || shift.department || 'Turnos',
      location: shift.location || 'Principal',
      extendedProps: {
        color: shift.backgroundColor,
        shiftTypeName: shift.shiftTypeName || '',
        department: shift.employeeDepartment || shift.department || 'Turnos',
        area: shift.employeeDepartment || shift.department || 'Turnos'
      }
    });
    setShowDetails(true);
  };

  return (
    <div className="upcoming-shifts">
      <div className="widget-header">
        <h3 className="widget-title">
          <span className="title-accent" aria-hidden="true"></span>
          <FaClock className="title-icon" />
          Próximos Turnos
        </h3>
      </div>
      
      <div className="shifts-list">
        {loading && <div style={{padding:12}}>Cargando próximos turnos...</div>}
        {!loading && upcomingShifts.length === 0 && <div style={{padding:12, color:'#777'}}>No hay próximos turnos programados</div>}
        {upcomingShifts.map((shift) => (
          <div
            key={shift.id}
            className="shift-item"
            style={{ '--shift-color': shift.shiftColor }}
          >
            <div className="shift-avatar" style={{ '--shift-color': shift.shiftColor }}>
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
                <button className="shift-action-btn" title="Ver detalles" aria-label="Ver detalles" onClick={() => openShiftDetails(shift)}>
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

      <ShiftDetails
        shift={selectedShift}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        hideActions
      />
    </div>
  );
};

export default UpcomingShifts;
