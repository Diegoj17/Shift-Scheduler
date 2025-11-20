import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import SidebarEmployee from '../../components/common/SidebarEmployee.jsx';
import { FaSyncAlt, FaClock, FaCalendarAlt, FaExclamationTriangle, FaClipboardList, FaMoneyBillWave, FaBullhorn } from 'react-icons/fa';
import WelcomeCard from '../../components/dashboard/user/WelcomeCard.jsx';
import TodayScheduleCard from '../../components/dashboard/user/TodayScheduleCard.jsx';
import { shiftService } from '../../services/shiftService';
import QuickActionsCard from '../../components/dashboard/user/QuickActionsCard.jsx';
import UpcomingShiftsCard from '../../components/dashboard/user/UpcomingShiftsCard.jsx';
import MonthlyStatsCard from '../../components/dashboard/user/MonthlyStatsCard.jsx';
import RemindersCard from '../../components/dashboard/user/RemindersCard.jsx';
import menuItems from '../../components/common/sidebarMenu.jsx';
import { useToast } from '../../contexts/NotificationToastContext.jsx';
import '@/styles/components/dashboard/user/WelcomeCard.css';

// Nota: moved activeItem state into component

const MainPage = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeItem, setActiveItem] = useState('dashboard');
  const { showToast } = useToast();
  // Estado local para controlar el sidebar (abierto / colapsado)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [employee] = useState({
    name: 'María González',
    position: 'Supervisor de Turnos',
    department: 'Recursos Humanos',
    employeeId: 'EMP-2345'
  });
  
  // Estado para el turno real traído desde el backend
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [loadingShift, setLoadingShift] = useState(false);
  const [shiftError, setShiftError] = useState(null);

  // Próximos turnos traídos del backend
  const [upcomingShifts, setUpcomingShifts] = useState([]);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [upcomingError, setUpcomingError] = useState(null);

  const [quickActions] = useState([
    { id: 1, title: 'Solicitar Cambio', icon: <FaSyncAlt />, color: '#4CAF50' },
    { id: 2, title: 'Registrar Horas', icon: <FaClock />, color: '#2196F3' },
    { id: 3, title: 'Ver Calendario', icon: <FaCalendarAlt />, color: '#FF9800' },
    { id: 4, title: 'Reportar Incidencia', icon: <FaExclamationTriangle />, color: '#F44336' }
  ]);

  const [monthlyStats] = useState({
    hoursWorked: 152,
    shiftsCompleted: 5,
    punctuality: '98%'
  });

  const [reminders] = useState([
    { icon: <FaClipboardList />, text: 'Revisión trimestral programada para el 25 de Enero' },
    { icon: <FaMoneyBillWave />, text: 'Nómina disponible para consulta' },
    { icon: <FaBullhorn />, text: 'Objetivos del mes: 85% completado' }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Este efecto se ejecutará cuando el componente se monte
    // y mostrará toasts si hay notificaciones pendientes
    console.log('🏠 MainPage montada - Sistema de toasts activo');
  }, []);

  // Polling: refrescar turno de hoy y próximos turnos cada X minutos
  useEffect(() => {
    const POLL_INTERVAL_MINUTES = 5; // cambiar aquí si se desea otra frecuencia
    const POLL_MS = POLL_INTERVAL_MINUTES * 60 * 1000;
    let mounted = true;

    const fetchTodayShift = async () => {
      setLoadingShift(true);
      setShiftError(null);
      try {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`; // formato YYYY-MM-DD

        const resp = await shiftService.getMyShifts({ date: dateStr });
        const shifts = Array.isArray(resp) ? resp : (resp.results || resp.data || []);

        const found = (shifts || []).find(s => {
          if (!s) return false;
          if (s.date === dateStr) return true;
          if (s.start && s.start.startsWith(dateStr)) return true;
          if (s.start_time && s.date === dateStr) return true;
          return false;
        }) || null;

        if (!mounted) return;

        if (found) {
          const startTime = found.start_time || (found.start && found.start.split('T')[1]) || '';
          const endTime = found.end_time || (found.end && found.end.split('T')[1]) || '';
          const fmtTime = (t) => (t ? (t.length >= 5 ? t.slice(0,5) : t) : '');

          const shiftLabel = `${found.shift_type_name || found.shift_type || 'Turno'} (${fmtTime(startTime)} - ${fmtTime(endTime)})`;
          const statusLabel = found.status ? String(found.status).charAt(0).toUpperCase() + String(found.status).slice(1) : 'Activo';
          const nextBreak = found.next_break || found.nextBreak || '-';

          setTodaySchedule({ shift: shiftLabel, status: statusLabel, nextBreak: nextBreak });
        } else {
          setTodaySchedule(null);
        }
      } catch (err) {
        console.error('Error fetching today shift:', err);
        if (!mounted) return;
        setShiftError(err.message || 'Error al obtener turno');
        setTodaySchedule(null);
      } finally {
        if (mounted) setLoadingShift(false);
      }
    };

    const fetchUpcoming = async () => {
      setLoadingUpcoming(true);
      setUpcomingError(null);
      try {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;

        const resp = await shiftService.getMyShifts({ start_date: dateStr, ordering: 'date' });
        const shiftsRaw = Array.isArray(resp) ? resp : (resp.results || resp.data || []);

        const mapped = (shiftsRaw || []).slice(0, 6).map(s => {
          const date = s.date || (s.start && s.start.split('T')[0]) || null;
          const start = s.start_time || (s.start && s.start.split('T')[1]) || '';
          const end = s.end_time || (s.end && s.end.split('T')[1]) || '';
          const fmt = t => t ? (t.length >= 5 ? t.slice(0,5) : t) : '-';
          const hours = (start || end) ? `${fmt(start)} - ${fmt(end)}` : '-';
          const shiftName = s.shift_type_name || s.shift_type || (s.shift_type && s.shift_type.name) || 'Turno';
          const isFree = (s.status && String(s.status).toLowerCase() === 'free') || (shiftName && shiftName.toLowerCase().includes('libre')) || (s.type === 'free');

          return { date: date || dateStr, shift: isFree ? 'Libre' : shiftName, hours: isFree ? '-' : hours };
        });

        if (!mounted) return;
        setUpcomingShifts(mapped);
      } catch (err) {
        console.error('Error fetching upcoming shifts:', err);
        if (!mounted) return;
        setUpcomingError(err.message || 'Error al obtener próximos turnos');
        setUpcomingShifts([]);
      } finally {
        if (mounted) setLoadingUpcoming(false);
      }
    };

    // llamada inmediata
    fetchTodayShift();
    fetchUpcoming();

    // polling periódica
    const intervalId = setInterval(() => {
      fetchTodayShift();
      fetchUpcoming();
    }, POLL_MS);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Obtener próximos turnos del backend (p. ej. próximos 6)
  // (fetchUpcoming ahora lo hace el efecto de polling)


  const handleActionClick = (actionId) => {
    const action = quickActions.find(a => a.id === actionId);
    if (!action) return;

    // Mostrar toast de confirmación
    showToast({
      type: 'info',
      title: 'Acción Iniciada',
      message: `Procesando: ${action.title}`
    });

    // Navegación existente
    if (action.id === 1) {
      navigate('/employee/shift-change-request');
      return;
    }
    if (action.id === 3) {
      navigate('/employee/calendar');
      return;
    }
    if (action.id === 2) {
      navigate('/employee/time');
      return;
    }
    
    // Por defecto, mantener comportamiento de alerta pero con toast
    showToast({
      type: 'success',
      title: action.title,
      message: 'Acción completada exitosamente'
    });
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleClockAction = () => {
    showToast({
      type: 'info', 
      title: 'Registro de Tiempo',
      message: 'Redirigiendo al registro de horas...'
    });
    navigate('/employee/time');
  };

  const handleItemClick = (itemId) => {
    setActiveItem(itemId);
  };

  return (
    <div className="dashboard-container">
      <SidebarEmployee 
      isOpen={isSidebarOpen} 
      onToggle={handleToggleSidebar} 
      activeItem={activeItem} 
      onItemClick={handleItemClick} 
      menuItems={menuItems}
      />

      <div className={`main-content ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <Header employee={employee} onToggleSidebar={handleToggleSidebar} pageTitle={`Inicio`} />

        <div className="content-area">
          <div className="dashboard-header-section">
            {/* espacio para título o widgets superiores si necesario */}
          </div>

          <div className="dashboard-main-grid">
            <div className="dashboard-primary-column">
              {/* Welcome grande en la parte superior */}
              <div className="primary-item">
                <WelcomeCard employeeName={employee.name} currentTime={currentTime} />
              </div>

              {/* Acciones rápidas justo debajo del welcome */}
              <div className="primary-item">
                <QuickActionsCard actions={quickActions} onActionClick={handleActionClick} />
              </div>
            </div>

            <div className="dashboard-secondary-column">
              {/* Turno de Hoy en la columna derecha, alineado al tope */}
              <div className="secondary-item">
                {/* Preparar fallback para evitar crash cuando no hay datos aún */}
                {(() => {
                  const fallback = {
                    shift: 'Sin turno asignado',
                    status: shiftError ? 'Error' : 'No asignado',
                    nextBreak: '-'
                  };
                  const scheduleForCard = todaySchedule || fallback;
                  return (
                    <>
                      <TodayScheduleCard schedule={scheduleForCard} onClockAction={handleClockAction} />
                      {loadingShift && <div style={{marginTop:8, color:'#666'}}>Cargando turno de hoy...</div>}
                      {shiftError && <div style={{marginTop:8, color:'#d9534f'}}>No se pudo obtener el turno: {shiftError}</div>}
                    </>
                  );
                })()}
              </div>

              {/* Puedes agregar otros widgets secundarios aquí */}
            </div>

            {/* Grid inferior con Próximos Turnos y Estadísticas y Recordatorios
                ahora está fuera de la columna primaria para poder ocupar todo el ancho */}
            <div className="lower-grid">
              <div className="lower-grid-item">
                  <UpcomingShiftsCard shifts={upcomingShifts} />
                  {loadingUpcoming && <div style={{marginTop:8, color:'#666'}}>Cargando próximos turnos...</div>}
                  {upcomingError && <div style={{marginTop:8, color:'#d9534f'}}>No se pudo obtener próximos turnos: {upcomingError}</div>}
              </div>

              <div className="lower-grid-item">
                <MonthlyStatsCard stats={monthlyStats} />
              </div>

              <div className="lower-grid-item">
                <RemindersCard reminders={reminders} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;