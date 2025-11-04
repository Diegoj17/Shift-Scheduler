import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import SidebarEmployee from '../../components/common/SidebarEmployee';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import ShiftFilters from '../../components/calendar/user/ShiftFilters';
import ShiftDetails from '../../components/calendar/user/ShiftDetails';
import EmptyState from '../../components/calendar/user/EmptyState';
import { 
  FaFilter, 
  FaSync, 
  FaCalendarDay,
  FaClock,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';
import { FiSun, FiClock, FiMoon } from 'react-icons/fi';
import '../../styles/pages/user/ShiftCalendar.css';

const ShiftCalendarPage = () => {
  const navigate = useNavigate();
  
  // Estados para el layout
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState("mi-calendario");

  // Estados para el calendario
  const calendarRef = useRef(null);
  const [viewType, setViewType] = useState('timeGridWeek');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Datos estáticos de ejemplo
  const staticShifts = [
    {
      id: 1,
      title: 'Turno Mañana - Cajero',
      start: new Date(new Date().setHours(8, 0, 0, 0)),
      end: new Date(new Date().setHours(16, 0, 0, 0)),
      role: 'Cajero',
      type: 'morning',
      location: 'Sucursal Centro',
      department: 'Atención al Cliente',
      status: 'confirmed'
    },
    {
      id: 2,
      title: 'Turno Tarde - Supervisor',
      start: new Date(new Date().setDate(new Date().getDate() + 1)).setHours(14, 0, 0, 0),
      end: new Date(new Date().setDate(new Date().getDate() + 1)).setHours(22, 0, 0, 0),
      role: 'Supervisor',
      type: 'afternoon',
      location: 'Sucursal Norte',
      department: 'Supervisión',
      status: 'confirmed'
    },
    {
      id: 3,
      title: 'Turno Noche - Seguridad',
      start: new Date(new Date().setDate(new Date().getDate() + 2)).setHours(22, 0, 0, 0),
      end: new Date(new Date().setDate(new Date().getDate() + 3)).setHours(6, 0, 0, 0),
      role: 'Seguridad',
      type: 'night',
      location: 'Sucursal Principal',
      department: 'Seguridad',
      status: 'confirmed'
    }
  ];

  const [shifts, setShifts] = useState([]);

  // Simular carga de datos
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setShifts(staticShifts);
      setLoading(false);
    }, 1000);
  }, []);

  // Funciones para el layout
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleItemClick = (itemId) => {
    setActiveItem(itemId);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Funciones del calendario
  const handleDatesSet = (dateInfo) => {
    setDateRange({ start: dateInfo.start, end: dateInfo.end });
  };

  const handleDateRangeChange = (start, end) => {
    setDateRange({ start, end });
    setLoading(true);
    setTimeout(() => {
      const filteredShifts = staticShifts.filter(shift => {
        const shiftDate = new Date(shift.start);
        return shiftDate >= start && shiftDate <= end;
      });
      setShifts(filteredShifts);
      setLoading(false);
    }, 500);
  };

  const handleEventClick = (clickInfo) => {
    const eventData = clickInfo.event.extendedProps;
    setSelectedEvent({
      ...eventData,
      start: clickInfo.event.start,
      end: clickInfo.event.end
    });
    setShowDetails(true);
  };

  const handleResetFilters = () => {
    const start = new Date();
    const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    setDateRange({ start, end });
    setLoading(true);
    setTimeout(() => {
      setShifts(staticShifts);
      setLoading(false);
    }, 500);
  };

  const handleExportCalendar = () => {
    if (!selectedEvent) {
      alert('No hay un turno seleccionado para exportar.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('No se pudo abrir la ventana para exportar. Revisa el bloqueador de ventanas emergentes.');
      return;
    }

    const fmtDate = (d) => new Date(d).toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const fmtTime = (d) => new Date(d).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    const durationHours = Math.round((new Date(selectedEvent.end) - new Date(selectedEvent.start)) / (1000 * 60 * 60));

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Detalle del Turno - ${selectedEvent.role}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; 
              margin:0; 
              background:#f6f8fb; 
              color:#1f2d3d; 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
            }
            .page { 
              max-width:900px; 
              margin:24px auto; 
              background:#fff; 
              border-radius:8px; 
              overflow:hidden; 
              box-shadow:0 6px 18px rgba(31,45,61,0.08); 
            }
            .header { 
              background: linear-gradient(90deg,#4f8cff,#3b82f6); 
              padding:22px 28px; 
              color:white; 
              display:flex; 
              align-items:center; 
              gap:12px; 
            }
            .badge { 
              background:rgba(255,255,255,0.12); 
              padding:6px 10px; 
              border-radius:999px; 
              font-weight:600; 
              display:inline-flex; 
              align-items:center; 
              gap:8px; 
            }
            .title { font-size:20px; font-weight:700; margin:0; }
            .body { padding:22px 28px; }
            .section { margin-bottom:18px; }
            .section h4 { 
              margin:0 0 10px 0; 
              font-size:13px; 
              color:#4f8cff; 
              display:flex; 
              align-items:center; 
              gap:8px; 
            }
            .grid { 
              display:grid; 
              grid-template-columns:1fr 1fr; 
              gap:12px 28px; 
              align-items:center; 
            }
            .label { color:#6b7280; font-size:13px; }
            .value { color:#111827; font-weight:600; }
            .footer { 
              padding:18px 28px; 
              border-top:1px solid #eef2f7; 
              display:flex; 
              justify-content:flex-end; 
              gap:12px; 
            }
            .btn { 
              padding:10px 14px; 
              border-radius:8px; 
              font-weight:600; 
              cursor:pointer; 
              border:none; 
            }
            .btn-primary { background:#4f8cff; color:white; }
            .btn-secondary { background:#e6eefc; color:#4f8cff; }
            @media print {
              body { background: #fff; }
              .page { box-shadow:none; border-radius:0; margin:0; }
              .footer .btn { display:none; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <div class="badge">
                ${selectedEvent.type === 'morning' ? '☀️ Mañana' : 
                  selectedEvent.type === 'afternoon' ? '⛅ Tarde' : '🌙 Noche'}
              </div>
              <div style="flex:1">
                <div class="title">Detalle del Turno</div>
                <div style="font-size:13px; color:rgba(255,255,255,0.9); margin-top:6px">
                  ${selectedEvent.role} — ${selectedEvent.department}
                </div>
              </div>
            </div>
            <div class="body">
              <div class="section">
                <h4>📅 Información de Horario</h4>
                <div class="grid">
                  <div><span class="label">Fecha:</span></div>
                  <div><span class="value">${fmtDate(selectedEvent.start)}</span></div>
                  <div><span class="label">Horario:</span></div>
                  <div><span class="value">${fmtTime(selectedEvent.start)} - ${fmtTime(selectedEvent.end)}</span></div>
                  <div><span class="label">Duración:</span></div>
                  <div><span class="value">${durationHours} horas</span></div>
                </div>
              </div>
              <div class="section">
                <h4>🏢 Información del Puesto</h4>
                <div class="grid">
                  <div><span class="label">Rol:</span></div>
                  <div><span class="value">${selectedEvent.role}</span></div>
                  <div><span class="label">Departamento:</span></div>
                  <div><span class="value">${selectedEvent.department}</span></div>
                  <div><span class="label">Ubicación:</span></div>
                  <div><span class="value">${selectedEvent.location}</span></div>
                </div>
              </div>
            </div>
            <div class="footer">
              <button class="btn btn-secondary" onclick="window.close()">Cerrar</button>
              <button class="btn btn-primary" onclick="window.print()">Imprimir</button>
            </div>
          </div>
          <script>
            // Imprimir automáticamente al cargar
            setTimeout(() => window.print(), 500);
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Preparar eventos para FullCalendar
  const calendarEvents = shifts.map(shift => ({
    id: shift.id,
    title: shift.title,
    start: shift.start,
    end: shift.end,
    backgroundColor: shift.type === 'morning' ? '#4CAF50' : 
                      shift.type === 'afternoon' ? '#FF9800' : '#2196F3',
    borderColor: 'transparent',
    textColor: 'white',
    classNames: [`shift-event`, `shift-${shift.type}`],
    extendedProps: {
      role: shift.role,
      type: shift.type,
      location: shift.location,
      department: shift.department,
      status: shift.status
    }
  }));

  return (
    <div className="shift-page-container">
      <SidebarEmployee 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar} 
        activeItem={activeItem} 
        onItemClick={handleItemClick}
        darkMode={false}
      />

      <div className={`shift-main-content ${!sidebarOpen ? 'shift-sidebar-collapsed' : ''}`}>
        <Header onToggleSidebar={toggleSidebar} pageTitle="Mi Calendario" />

        <div className="shift-content-area">
          <div className="shift-page-header">
            <div className="shift-header-actions">
              <button 
                className="shift-action-btn shift-btn-secondary" 
                onClick={toggleFilters}
                aria-label={showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
              >
                {showFilters ? <FaEyeSlash className="shift-btn-icon" /> : <FaEye className="shift-btn-icon" />}
                {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              </button>
              <button 
                className="shift-action-btn shift-btn-secondary" 
                onClick={handleResetFilters}
                aria-label="Restablecer vista"
              >
                <FaSync className="shift-btn-icon" aria-hidden="true" />
                Restablecer Vista
              </button>
              <button 
                className="shift-action-btn shift-btn-primary" 
                onClick={() => calendarRef.current?.getApi().today()}
                aria-label="Ir a hoy"
              >
                <FaCalendarDay className="shift-btn-icon" aria-hidden="true" />
                Hoy
              </button>
            </div>
          </div>

          <div className="shift-calendar-content">
            {/* Contenedor de filtros con animación de mostrar/ocultar */}
            <div className={`shift-filters-container ${showFilters ? 'shift-filters-visible' : 'shift-filters-hidden'}`}>
              <ShiftFilters 
                onDateRangeChange={handleDateRangeChange}
                loading={loading}
              />
            </div>
            
            {loading ? (
              <div className="shift-loading-state">
                <div className="shift-loading-spinner"></div>
                <p>Cargando turnos...</p>
              </div>
            ) : shifts.length === 0 ? (
              <EmptyState onResetFilters={handleResetFilters} />
            ) : (
              <div className="shift-calendar-wrapper">
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView={viewType}
                  locale={esLocale}
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                  }}
                  events={calendarEvents}
                  datesSet={handleDatesSet}
                  eventClick={handleEventClick}
                  height="auto"
                  slotMinTime="06:00:00"
                  slotMaxTime="24:00:00"
                  allDaySlot={false}
                  nowIndicator={true}
                  scrollTime="08:00:00"
                  slotDuration="01:00:00"
                  slotLabelInterval="01:00:00"
                  eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  }}
                  dayHeaderFormat={{
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                  }}
                  eventDisplay="block"
                  eventContent={(eventInfo) => (
                    <div className="shift-event-content">
                      <div className="shift-event-time">
                        <FaClock className="shift-event-time-icon" aria-hidden="true" />
                        {eventInfo.timeText}
                      </div>
                      <div className="shift-event-title">
                        {eventInfo.event.title}
                      </div>
                      <div className="shift-event-type">
                        {eventInfo.event.extendedProps.type === 'morning' && (
                          <>
                            <FiSun className="shift-event-type-icon" aria-hidden="true" />
                            Mañana
                          </>
                        )}
                        {eventInfo.event.extendedProps.type === 'afternoon' && (
                          <>
                            <FiClock className="shift-event-type-icon" aria-hidden="true" />
                            Tarde
                          </>
                        )}
                        {eventInfo.event.extendedProps.type === 'night' && (
                          <>
                            <FiMoon className="shift-event-type-icon" aria-hidden="true" />
                            Noche
                          </>
                        )}
                      </div>
                    </div>
                  )}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <ShiftDetails 
        shift={selectedEvent}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        onExport={handleExportCalendar}
      />
    </div>
  );
};

export default ShiftCalendarPage;