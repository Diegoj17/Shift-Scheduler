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
import shiftService from '../../services/shiftService'; 
import { 
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
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState("mi-calendario");
  const calendarRef = useRef(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  });
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [shifts, setShifts] = useState([]);
  const [calendarKey, setCalendarKey] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadMyShifts();
  }, [navigate]);

  useEffect(() => {
    if (calendarRef.current) {
      setTimeout(() => {
        calendarRef.current.getApi().updateSize();
      }, 350);
    }
  }, [sidebarOpen]);

  // Cuando se muestran/ocultan los filtros forzamos que FullCalendar reajuste tamaño
  useEffect(() => {
    if (calendarRef.current) {
      // pequeño timeout para esperar layout reflow
      setTimeout(() => {
        try {
          calendarRef.current.getApi().updateSize();
        } catch (err) {
          void err;
        }
      }, 200);
    }
  }, [showFilters]);

  // Modifica tu loadMyShifts para procesar los datos
// Agrega este debug en loadMyShifts
const loadMyShifts = async () => {
  setLoading(true);
  try {
    console.log('🔄 Cargando turnos iniciales...');
    const myShifts = await shiftService.getMyShiftsForCalendar();
    
    // Debug detallado de los datos crudos
    console.log('📦 Datos crudos recibidos:', myShifts);
    myShifts.forEach((shift, index) => {
      console.log(`📊 Turno ${index + 1}:`, {
        id: shift.id,
        title: shift.title,
        start: shift.start,
        end: shift.end,
        isDate: shift.start instanceof Date,
        startHour: shift.start instanceof Date ? shift.start.getHours() : 'N/A'
      });
    });
    
    // Procesar los turnos
    const processedShifts = myShifts.map(shift => {
      const shiftType = getShiftTypeFromData(shift);
      
      return {
        ...shift,
        extendedProps: {
          ...shift.extendedProps,
          type: shiftType,
          role: shift.extendedProps?.role || shift.title?.split(' - ')[1] || 'Supervisor',
          department: shift.extendedProps?.department || 'Turnos',
          location: shift.extendedProps?.location || 'Principal'
        }
      };
    });
    
    console.log('✅ Turnos procesados:', processedShifts);
    setShifts(processedShifts);
    setCalendarKey(prev => prev + 1);
  } catch (error) {
    console.error('❌ Error cargando turnos:', error);
  } finally {
    setLoading(false);
  }
};

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const handleItemClick = (itemId) => setActiveItem(itemId);
  const toggleFilters = () => setShowFilters(prev => !prev);

  const handleDatesSet = (dateInfo) => {
    setDateRange({ start: dateInfo.start, end: dateInfo.end });
  };

  const handleDateRangeChange = async (start, end) => {
  console.log('📅 Filtrando turnos del', start.toLocaleDateString(), 'al', end.toLocaleDateString());
  
  setDateRange({ start, end });
  setLoading(true);
  
  try {
    const params = {
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0]
    };
    
    const filteredShifts = await shiftService.getMyShiftsForCalendar(params);
    
    // Procesar los turnos filtrados también
    const processedShifts = filteredShifts.map(shift => {
      const shiftType = getShiftTypeFromData(shift);
      
      return {
        ...shift,
        extendedProps: {
          ...shift.extendedProps,
          type: shiftType
        }
      };
    });
    
    console.log('✅ Turnos filtrados procesados:', processedShifts.length);
    setShifts(processedShifts);
    setCalendarKey(prev => prev + 1);
    
    // Resto del código...
  } catch (error) {
    console.error('❌ Error filtrando turnos:', error);
  } finally {
    setLoading(false);
  }
};

  const handleEventClick = (clickInfo) => {
  const event = clickInfo.event;
  const eventData = event.extendedProps;
  
  console.log('🖱️ Evento clickeado:', {
    id: event.id,
    title: event.title,
    backgroundColor: event.backgroundColor,
    extendedProps: eventData
  });
  
  setSelectedEvent({
    ...eventData,
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    backgroundColor: event.backgroundColor, // ✅ Pasar el color del evento
    type: eventData.type || getShiftTypeFromData(event),
    // ✅ Asegurar que todos los datos estén presentes
    role: eventData.role || 'Supervisor',
    department: eventData.department || 'Turnos', 
    location: eventData.location || 'Principal',
    shiftTypeName: eventData.shiftTypeName || 'Turno'
  });
  setShowDetails(true);
};

  const handleResetFilters = async () => {
    console.log('🔄 Restableciendo filtros...');
    const start = new Date();
    const end = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    setDateRange({ start, end });
    await loadMyShifts();
    if (calendarRef.current) {
      calendarRef.current.getApi().today();
    }
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

  // ✅ CORREGIDO - CSS limpio sin código JS mezclado
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
            ${selectedEvent.notes ? `
            <div class="section">
              <h4>📝 Notas</h4>
              <div class="value">${selectedEvent.notes}</div>
            </div>
            ` : ''}
          </div>
          <div class="footer">
            <button class="btn btn-secondary" onclick="window.close()">Cerrar</button>
            <button class="btn btn-primary" onclick="window.print()">Imprimir</button>
          </div>
        </div>
        <script>
          setTimeout(() => window.print(), 500);
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};

// Función corregida con lógica precisa para determinar el tipo de turno
const getShiftTypeFromData = (shift) => {
  console.log('🔍 Analizando turno para tipo:', {
    title: shift.title,
    start: shift.start,
    startHour: shift.start instanceof Date ? shift.start.getHours() : 'N/A'
  });

  // Si ya existe un tipo definido, usarlo
  if (shift.extendedProps?.type) {
    return shift.extendedProps.type;
  }

  // Determinar por la hora de inicio (lógica corregida)
  if (shift.start instanceof Date) {
    const startHour = shift.start.getHours();
    console.log('⏰ Hora de inicio:', startHour);
    
    // ✅ LÓGICA CORREGIDA:
    // Mañana: 6:00 AM - 11:59 AM (6-11)
    // Tarde: 12:00 PM - 5:59 PM (12-17)  
    // Noche: 6:00 PM - 5:59 AM (18-23, 0-5)
    
    if (startHour >= 6 && startHour < 12) {
      console.log('✅ Clasificado como: MAÑANA (6:00-11:59)');
      return 'morning';
    } else if (startHour >= 12 && startHour < 18) {
      console.log('✅ Clasificado como: TARDE (12:00-17:59)');
      return 'afternoon';
    } else {
      console.log('✅ Clasificado como: NOCHE (18:00-5:59)');
      return 'night';
    }
  }

  // Determinar por el título (fallback mejorado)
  const title = shift.title || '';
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('mañana') || titleLower.includes('morning') || titleLower.includes('aman')) {
    return 'morning';
  }
  if (titleLower.includes('tarde') || titleLower.includes('afternoon') || titleLower.includes('tard')) {
    return 'afternoon';
  }
  if (titleLower.includes('noche') || titleLower.includes('night') || titleLower.includes('noch')) {
    return 'night';
  }

  console.log('⚠️ Usando default: morning');
  return 'morning';
};

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
                type="button"
                className="shift-action-btn shift-btn-secondary" 
                onClick={toggleFilters}
              >
                {showFilters ? <FaEyeSlash /> : <FaEye />}
                <span>{showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}</span>
              </button>
              <button 
                type="button"
                className="shift-action-btn shift-btn-secondary" 
                onClick={handleResetFilters}
              >
                <FaSync />
                <span>Restablecer Vista</span>
              </button>
              <button 
                type="button"
                className="shift-action-btn shift-btn-primary" 
                onClick={() => calendarRef.current?.getApi().today()}
              >
                <FaCalendarDay />
                <span>Hoy</span>
              </button>
            </div>
          </div>

          <div className="shift-calendar-content">
            {showFilters && (
              <div style={{ marginBottom: '1.5rem' }}>
                <ShiftFilters 
                  onDateRangeChange={handleDateRangeChange}
                  loading={loading}
                />
              </div>
            )}
            
            {loading ? (
              <div className="shift-calendar-wrapper">
              <div className="shift-loading-state">
                <div className="shift-loading-spinner"></div>
                <p>Cargando turnos...</p>
                </div>
              </div>
            ) : shifts.length === 0 ? (
              <div className="shift-empty-calendar-container">
                <EmptyState onResetFilters={handleResetFilters} />
              </div>
            ) : (
              <>
                <div className="shift-calendar-wrapper">
                  <FullCalendar
                    key={calendarKey}
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    locale={esLocale}
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    events={shifts.map(shift => {
  // ✅ OBTENER EL COLOR CORRECTAMENTE
  const actualColor = shift.backgroundColor || shift.extendedProps?.color;
  
  console.log('🎨 Calendario - Color del turno:', {
    title: shift.title,
    colorBD: shift.extendedProps?.color,
    backgroundColor: shift.backgroundColor,
    colorFinal: actualColor,
    extendedProps: shift.extendedProps
  });
  
  return {
    ...shift,
    backgroundColor: actualColor,
    borderColor: actualColor,
    textColor: 'white',
    extendedProps: {
      ...shift.extendedProps,
      color: actualColor, // ✅ Asegurar que el color se pase
      type: shift.extendedProps?.type || getShiftTypeFromData(shift)
    }
  };
})}
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
                    
                    eventMinHeight={80}
                    expandRows={true}
                    
                    eventTimeFormat={{
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    }}
                    dayHeaderFormat={{ weekday: 'short' }}
                    eventDisplay="block"
                    
                    eventDidMount={(info) => {
                      console.log('✅ Evento montado:', {
                        title: info.event.title,
                        start: info.event.start,
                        view: info.view.type
                      });
                    }}
                    
                    eventContent={(eventInfo) => (
                      <div className="shift-event-content">
                        <div className="shift-event-time">
                          <FaClock />
                          {eventInfo.timeText}
                        </div>
                        <div className="shift-event-title">
                          {eventInfo.event.title}
                        </div>
                        <div className="shift-event-type">
                          {eventInfo.event.extendedProps.type === 'morning' && (
                            <>
                              <FiSun /> Mañana
                            </>
                          )}
                          {eventInfo.event.extendedProps.type === 'afternoon' && (
                            <>
                              <FiClock /> Tarde
                            </>
                          )}
                          {eventInfo.event.extendedProps.type === 'night' && (
                            <>
                              <FiMoon /> Noche
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  />
                </div>
              </>
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