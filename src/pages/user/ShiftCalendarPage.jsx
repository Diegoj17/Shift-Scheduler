import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import SidebarEmployee from '../../modules/user/components/SidebarEmployee';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { 
  FaCalendarAlt, 
  FaFilter, 
  FaSync, 
  FaCalendarDay,
  FaArrowLeft,
  FaClock,
  FaMapMarkerAlt,
  FaBuilding,
  FaCheckCircle,
  FaDownload,
  FaExchangeAlt,
  FaEye,
  FaEyeSlash,
  FaCog
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
  const exportRef = useRef(null);
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
    setSelectedEvent(clickInfo.event.extendedProps);
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

  // Exportar calendario: abre nueva pestaña con el HTML del calendario e invoca print()
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

    const fmtDate = (d) => new Date(d).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const fmtTime = (d) => new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const durationHours = Math.round((new Date(selectedEvent.end) - new Date(selectedEvent.start)) / (1000 * 60 * 60));

    // Construir HTML limpio y profesional para el turno
    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Detalle del Turno - ${selectedEvent.role}</title>
          <style>
            /* Preserve visual appearance on screen */
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; margin:0; background:#f6f8fb; color:#1f2d3d; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
            .page { max-width:900px; margin:24px auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 6px 18px rgba(31,45,61,0.08); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .header { background: linear-gradient(90deg,#2b6df6,#4f8cff); padding:22px 28px; color:white; display:flex; align-items:center; gap:12px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .badge { background:rgba(255,255,255,0.12); padding:6px 10px; border-radius:999px; font-weight:600; display:inline-flex; align-items:center; gap:8px; }
            .title { font-size:20px; font-weight:700; margin:0; }
            .body { padding:22px 28px; }
            .section { margin-bottom:18px; }
            .section h4 { margin:0 0 10px 0; font-size:13px; color:#2b6df6; display:flex; align-items:center; gap:8px; }
            .grid { display:grid; grid-template-columns:1fr 1fr; gap:12px 28px; align-items:center; }
            .label { color:#6b7280; font-size:13px; }
            .value { color:#111827; font-weight:600; }
            .footer { padding:18px 28px; border-top:1px solid #eef2f7; display:flex; justify-content:flex-end; gap:12px; }
            .btn { padding:10px 14px; border-radius:8px; font-weight:600; cursor:pointer; border:none; }
            .btn-primary { background:#2563eb; color:white; }
            .btn-secondary { background:#e6eefc; color:#2563eb; }
            /* Print rules: keep visual layout and colors as in the tab. Note: browsers may require "print backgrounds" enabled in the print dialog to include background colors. */
            @media print {
              body { background: #fff; }
              .page { box-shadow:none; border-radius:0; margin:0; }
              /* Keep header background and colors when possible */
              .header, .page { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              /* Hide interactive controls that don't make sense on paper (buttons) but keep layout appearance */
              .footer .btn { display:none; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <div class="badge">${selectedEvent.type === 'morning' ? '☀️ Mañana' : selectedEvent.type === 'afternoon' ? '⛅ Tarde' : '🌙 Noche'}</div>
              <div style="flex:1">
                <div class="title">Detalle del Turno</div>
                <div style="font-size:13px; color:rgba(255,255,255,0.9); margin-top:6px">${selectedEvent.role} — ${selectedEvent.department}</div>
              </div>
            </div>
            <div class="body">
              <div class="section">
                <h4>Información Principal</h4>
                <div class="grid">
                  <div>
                    <div class="label">Fecha</div>
                    <div class="value">${fmtDate(selectedEvent.start)}</div>
                  </div>
                  <div>
                    <div class="label">Horario</div>
                    <div class="value">${fmtTime(selectedEvent.start)} — ${fmtTime(selectedEvent.end)}</div>
                  </div>
                  <div>
                    <div class="label">Duración</div>
                    <div class="value">${durationHours} horas</div>
                  </div>
                  <div>
                    <div class="label">Estado</div>
                    <div class="value">${selectedEvent.status === 'confirmed' ? 'Confirmado' : selectedEvent.status}</div>
                  </div>
                </div>
              </div>

              <div class="section">
                <h4>Información del Puesto</h4>
                <div class="grid">
                  <div>
                    <div class="label">Rol</div>
                    <div class="value">${selectedEvent.role}</div>
                  </div>
                  <div>
                    <div class="label">Departamento</div>
                    <div class="value">${selectedEvent.department}</div>
                  </div>
                  <div style="grid-column:1 / -1">
                    <div class="label">Ubicación</div>
                    <div class="value">${selectedEvent.location}</div>
                  </div>
                </div>
              </div>
            </div>
            <div class="footer">
              <button class="btn btn-secondary" onclick="window.close();">Cancelar</button>
              <button class="btn btn-primary" onclick="window.print();">Imprimir / Guardar PDF</button>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedEvent(null);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Configuración de colores para tipos de turno
  const getEventColor = (shift) => {
    const colors = {
      morning: {
        background: '#4CAF50',
        border: '#388E3C',
        text: '#FFFFFF'
      },
      afternoon: {
        background: '#FF9800',
        border: '#F57C00',
        text: '#FFFFFF'
      },
      night: {
        background: '#2196F3',
        border: '#1976D2',
        text: '#FFFFFF'
      }
    };
    
    return colors[shift.type] || colors.morning;
  };

  // Preparar eventos para FullCalendar
  const calendarEvents = shifts.map(shift => {
    const colors = getEventColor(shift);
    return {
      id: shift.id,
      title: `${shift.role}`,
      start: shift.start,
      end: shift.end,
      extendedProps: shift,
      backgroundColor: colors.background,
      borderColor: colors.border,
      textColor: colors.text,
      classNames: ['shift-event', `shift-${shift.type}`],
      display: 'block'
    };
  });

  // Componente de Filtros Mejorado
  const ShiftFilters = () => {
    const [localDateRange, setLocalDateRange] = useState({
      start: dateRange.start.toISOString().split('T')[0],
      end: dateRange.end.toISOString().split('T')[0]
    });

    const handleDateChange = (e) => {
      const { name, value } = e.target;
      const newRange = { ...localDateRange, [name]: value };
      setLocalDateRange(newRange);
      
      if (newRange.start && newRange.end) {
        handleDateRangeChange(new Date(newRange.start), new Date(newRange.end));
      }
    };

    const setQuickRange = (days) => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);
      
      const newRange = {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      };
      
      setLocalDateRange(newRange);
      handleDateRangeChange(start, end);
    };

    return (
      <div className={`shift-filters-container ${showFilters ? 'shift-filters-visible' : 'shift-filters-hidden'}`}>
        <div className="shift-filters-header">
          <div className="shift-filters-title">
            <FaFilter className="shift-filter-icon" />
            <h3>Filtrar Turnos</h3>
          </div>
          <div className="shift-filters-actions">
            <span className="shift-shifts-count">
              <FaCalendarAlt className="shift-count-icon" />
              {shifts.length} turnos
            </span>
          </div>
        </div>

        <div className="shift-filters-content">
          <div className="shift-date-section">
            <div className="shift-date-inputs-grid">
              <div className="shift-input-group">
                <label htmlFor="start-date">
                  <FaCalendarDay className="shift-input-icon" />
                  Fecha inicial
                </label>
                <input
                  type="date"
                  id="start-date"
                  name="start"
                  value={localDateRange.start}
                  onChange={handleDateChange}
                  disabled={loading}
                />
              </div>
              
              <div className="shift-input-group">
                <label htmlFor="end-date">
                  <FaCalendarDay className="shift-input-icon" />
                  Fecha final
                </label>
                <input
                  type="date"
                  id="end-date"
                  name="end"
                  value={localDateRange.end}
                  onChange={handleDateChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="shift-quick-filters">
              <label>Rangos rápidos:</label>
              <div className="shift-quick-buttons">
                <button 
                  onClick={() => setQuickRange(7)}
                  disabled={loading}
                  className="shift-quick-btn"
                >
                  Últimos 7 días
                </button>
                <button 
                  onClick={() => setQuickRange(30)}
                  disabled={loading}
                  className="shift-quick-btn"
                >
                  Últimos 30 días
                </button>
                <button 
                  onClick={() => setQuickRange(90)}
                  disabled={loading}
                  className="shift-quick-btn"
                >
                  Últimos 3 meses
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Componente de Detalles del Turno
  const ShiftDetails = () => {
    if (!showDetails || !selectedEvent) return null;

    const formatTime = (dateString) => {
      return new Date(dateString).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const getShiftTypeInfo = (type) => {
      const types = {
        morning: { label: 'Mañana', color: '#4CAF50', icon: '☀️' },
        afternoon: { label: 'Tarde', color: '#FF9800', icon: '⛅' },
        night: { label: 'Noche', color: '#2196F3', icon: '🌙' }
      };
      return types[type] || types.morning;
    };

    const typeInfo = getShiftTypeInfo(selectedEvent.type);

    return (
      <div className="shift-modal-overlay" onClick={handleCloseDetails}>
        <div className="shift-modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="shift-close-btn" onClick={handleCloseDetails}>
            <FaArrowLeft />
          </button>
          
          <div className="shift-modal-header">
            <div className="shift-type-badge" style={{ backgroundColor: typeInfo.color }}>
              <span className="shift-type-icon">{typeInfo.icon}</span>
              <span className="shift-type-label">{typeInfo.label}</span>
            </div>
            <h2>Detalles del Turno</h2>
          </div>
          
          <div className="shift-modal-body">
            <div className="shift-detail-section">
              <h4>
                <FaClock className="shift-section-icon" />
                Información Principal
              </h4>
              <div className="shift-detail-grid">
                <div className="shift-detail-item">
                  <span className="shift-detail-label">Fecha</span>
                  <span className="shift-detail-value">{formatDate(selectedEvent.start)}</span>
                </div>
                <div className="shift-detail-item">
                  <span className="shift-detail-label">Horario</span>
                  <span className="shift-detail-value">
                    {formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}
                  </span>
                </div>
                <div className="shift-detail-item">
                  <span className="shift-detail-label">Duración</span>
                  <span className="shift-detail-value">
                    {Math.round((new Date(selectedEvent.end) - new Date(selectedEvent.start)) / (1000 * 60 * 60))} horas
                  </span>
                </div>
              </div>
            </div>

            <div className="shift-detail-section">
              <h4>
                <FaBuilding className="shift-section-icon" />
                Información del Puesto
              </h4>
              <div className="shift-detail-grid">
                <div className="shift-detail-item">
                  <span className="shift-detail-label">Rol</span>
                  <span className="shift-detail-role">{selectedEvent.role}</span>
                </div>
                <div className="shift-detail-item">
                  <span className="shift-detail-label">Departamento</span>
                  <span className="shift-detail-value">{selectedEvent.department}</span>
                </div>
                <div className="shift-detail-item">
                  <span className="shift-detail-label">Ubicación</span>
                  <span className="shift-detail-location">
                    <FaMapMarkerAlt className="shift-location-icon" />
                    {selectedEvent.location}
                  </span>
                </div>
              </div>
            </div>

            <div className="shift-detail-section">
              <h4>
                <FaCheckCircle className="shift-section-icon" />
                Estado
              </h4>
              <div className="shift-status-badge">
                <FaCheckCircle className="shift-status-icon" />
                Confirmado
              </div>
            </div>
          </div>
          
          <div className="shift-modal-footer">
            <button onClick={handleExportCalendar} className="shift-btn shift-btn-primary">
              <FaDownload className="shift-btn-icon" />
              Exportar
            </button>
            <button className="shift-btn shift-btn-secondary">
              <FaExchangeAlt className="shift-btn-icon" />
              Solicitar Cambio
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Componente de Estado Vacío
  const EmptyState = () => (
    <div className="shift-empty-state">
      <div className="shift-empty-illustration">
        <FaCalendarAlt className="shift-empty-icon" />
      </div>
      <h3>Sin turnos en el rango seleccionado</h3>
      <p>No se encontraron turnos asignados para las fechas seleccionadas.</p>
      <button onClick={handleResetFilters} className="shift-reset-btn">
        <FaSync className="shift-reset-icon" />
        Ver todos los turnos
      </button>
    </div>
  );

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
              <button className="shift-action-btn shift-btn-secondary" onClick={toggleFilters}>
                <FaFilter className="shift-btn-icon" />
                {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
              </button>
              <button className="shift-action-btn shift-btn-secondary" onClick={handleResetFilters}>
                <FaSync className="shift-btn-icon" />
                Restablecer Vista
              </button>
              <button className="shift-action-btn shift-btn-secondary" onClick={() => calendarRef.current?.getApi().today()}>
                <FaCalendarDay className="shift-btn-icon" />
                Hoy
              </button>
            </div>
          </div>

          <div className="shift-calendar-content">
            <ShiftFilters />
            
            {loading && (
              <div className="shift-loading-state">
                <div className="shift-loading-spinner"></div>
                <p>Cargando turnos...</p>
              </div>
            )}

            {!loading && shifts.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="shift-calendar-wrapper" ref={exportRef}>
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView={viewType}
                  locale={esLocale}
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek'
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
                        <FaClock className="shift-event-time-icon" />
                        {eventInfo.timeText}
                      </div>
                      <div className="shift-event-title">
                        {eventInfo.event.title}
                      </div>
                      <div className="shift-event-type">
                        {eventInfo.event.extendedProps.type === 'morning' && (
                          <>
                            <FiSun className="shift-event-type-icon" />
                            Mañana
                          </>
                        )}
                        {eventInfo.event.extendedProps.type === 'afternoon' && (
                          <>
                            <FiClock className="shift-event-type-icon" />
                            Tarde
                          </>
                        )}
                        {eventInfo.event.extendedProps.type === 'night' && (
                          <>
                            <FiMoon className="shift-event-type-icon" />
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

      <ShiftDetails />
    </div>
  );
};

export default ShiftCalendarPage;