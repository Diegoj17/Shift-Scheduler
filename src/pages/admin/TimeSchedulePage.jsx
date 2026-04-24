import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { MdCalendarToday, MdInbox, MdAccessTime, MdBusiness, MdTune } from 'react-icons/md';
import TimeScheduleFilter from '../../components/time/admin/TimeScheduleFilter';
import TimeScheduleList from '../../components/time/admin/TimeScheduleList';
import TimeScheduleStats from '../../components/time/admin/TimeScheduleStats';
import TimeScheduleDetails from '../../components/time/admin/TimeScheduleDetails';
import ShiftModal from '../../components/calendar/admin/ShiftModal';
import Sidebar from '../../components/common/Sidebar';
import Header from '../../components/common/Header';
import availabilityService, { AVAILABILITY_COLORS } from '../../services/availabilityService';
import shiftService from '../../services/shiftService';
import '../../styles/pages/admin/TimeSchedulePage.css';

const ADMIN_AVAILABILITY_COLORS = {
  available: '#38a169',
  unavailable: '#e53e3e'
};

const TimeSchedulePage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState("disponibilidad");
  const calendarRef = useRef(null);
  
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    employee: '',
    area: '',
    role: '',
    type: '' // 'available' o 'unavailable'
  });

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftToEdit, setShiftToEdit] = useState(null);
  const [availabilities, setAvailabilities] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [shiftTypes, setShiftTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Inicio", icon: "dashboard" },
    { id: "calendario", label: "Calendario", icon: "calendar" },
    { id: "disponibilidad", label: "Disponibilidad", icon: "availability" },
    { id: "solicitudes", label: "Solicitudes", icon: "requests" },
    { id: "equipo", label: "Equipo", icon: "team" },
    { id: "informes", label: "Informes", icon: "reports" },
  ];

  // ✅ Cargar datos al montar
  useEffect(() => {
    loadInitialData();
  }, []);

  // ✅ Recargar cuando cambien los filtros
  useEffect(() => {
    loadAvailabilities();
  }, [filters]);

  const resolveAvailabilityColor = (avail) => {
    return avail?.type === 'available'
      ? ADMIN_AVAILABILITY_COLORS.available
      : ADMIN_AVAILABILITY_COLORS.unavailable;
  };

  const normalizeAvailability = (avail) => ({
    ...avail,
    resolvedColor: resolveAvailabilityColor(avail),
    adminResolvedColor: resolveAvailabilityColor(avail),
    availabilityNumber: Number.isFinite(Number(avail?.availabilityNumber))
      ? Number(avail.availabilityNumber)
      : (Number.isFinite(Number(avail?.id)) ? Number(avail.id) : null),
    employeeName: avail.employee_name || avail.employeeName || 'Sin nombre',
    startTime: avail.start_time || avail.startTime || '00:00',
    endTime: avail.end_time || avail.endTime || '00:00',
    area: avail.employee_area || avail.area || 'Sin área'
  });

  useEffect(() => {
    if (calendarRef.current) {
      setTimeout(() => {
        calendarRef.current.getApi().updateSize();
      }, 350);
    }
  }, [sidebarOpen]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // Cargar en paralelo
      const [availData, empData, typesData] = await Promise.all([
        availabilityService.getAvailabilities(),
        shiftService.getEmployees(),
        shiftService.getShiftTypes()
      ]);

      setAvailabilities((availData || []).map(normalizeAvailability));
      setEmployees(empData);
      setShiftTypes(typesData);
    } catch (error) {
      console.error('❌ Error al cargar datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailabilities = async () => {
    try {
      
      // Construir parámetros de consulta
      const params = {};
      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;
      if (filters.employee) params.employee = filters.employee;
      if (filters.type) params.type = filters.type;

      const data = await availabilityService.getAvailabilities(params);
      
      setAvailabilities((data || []).map(normalizeAvailability));
    } catch (error) {
      console.error('❌ Error al cargar disponibilidades:', error);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const getFilteredAvailabilities = () => {
    return availabilities.filter(avail => {
      // Filtros adicionales del cliente (área, rol)
      if (filters.area && avail.employee_area !== filters.area) return false;
      if (filters.role && avail.employee_position !== filters.role) return false;
      return true;
    });
  };

  const filteredData = getFilteredAvailabilities();

  const toIsoRange = (dateValue, startTimeValue, endTimeValue) => {
    const safeDate = String(dateValue || '').trim();
    const safeStart = String(startTimeValue || '00:00').trim();
    const safeEnd = String(endTimeValue || '00:00').trim();
    const startIso = `${safeDate}T${safeStart}`;
    let endIso = `${safeDate}T${safeEnd}`;

    const startDate = new Date(startIso);
    let endDate = new Date(endIso);

    // Si la hora de fin es menor o igual que la inicial, el rango cruza medianoche.
    if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && endDate <= startDate) {
      endDate.setDate(endDate.getDate() + 1);
      const year = endDate.getFullYear();
      const month = String(endDate.getMonth() + 1).padStart(2, '0');
      const day = String(endDate.getDate()).padStart(2, '0');
      const hours = String(endDate.getHours()).padStart(2, '0');
      const minutes = String(endDate.getMinutes()).padStart(2, '0');
      const seconds = String(endDate.getSeconds()).padStart(2, '0');
      endIso = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }

    return { startIso, endIso };
  };

  const formatEventHourRange = (startTimeValue, endTimeValue) => {
    const to12h = (value) => {
      const parts = String(value || '').split(':');
      const hh = Number(parts[0]);
      const mm = Number(parts[1] || 0);
      if (Number.isNaN(hh) || Number.isNaN(mm)) return String(value || '');
      const period = hh >= 12 ? 'p. m.' : 'a. m.';
      const hour12 = hh % 12 === 0 ? 12 : hh % 12;
      return `${hour12}:${String(mm).padStart(2, '0')} ${period}`;
    };

    return `${to12h(startTimeValue)} - ${to12h(endTimeValue)}`;
  };

  // ✅ Convertir disponibilidades a eventos de FullCalendar
  const calendarEvents = filteredData.map((avail, index) => {
    const { startIso, endIso } = toIsoRange(avail.date, avail.start_time, avail.end_time);
    const displayNumber = Number.isFinite(Number(avail.availabilityNumber))
      ? Number(avail.availabilityNumber)
      : index + 1;
    return {
      id: avail.id.toString(),
      title: avail.employee_name || 'Sin nombre',
      start: startIso,
      end: endIso,
      backgroundColor: avail.adminResolvedColor,
      borderColor: avail.adminResolvedColor,
      textColor: 'white',
      extendedProps: {
        ...avail
        ,displayNumber
      }
    };
  });

  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event;
    setSelectedEvent(event.extendedProps);
    setShowDetails(true);
  };

  // En TimeSchedulePage.jsx - función handleAssignFromDetails

const handleAssignFromDetails = async (availability) => {
  
  setShowDetails(false);

  // ✅ CRÍTICO: Usar employee_id del backend (NO employee ni user_id)
  const employeeId = availability.employee_id;
  

  const shift = {
    start: `${availability.date}T${availability.start_time}`,
    end: `${availability.date}T${availability.end_time}`,
    employeeId: employeeId,           // ✅ EMPLOYEE_ID correcto
    employee: employeeId,              // ✅ Para el backend
    employeeName: availability.employee_name,
    startTime: availability.start_time,
    endTime: availability.end_time,
    date: availability.date
  };


  setShiftToEdit(shift);

  try {
    const cal = calendarRef.current && calendarRef.current.getApi();
    if (cal) {
      cal.changeView('timeGridWeek');
      cal.gotoDate(availability.date);
    }
  } catch {
    // ignore
  }

  setTimeout(() => {
    setShowShiftModal(true);
  }, 160);
};

  const handleSaveShift = (shiftData) => {
    setShowShiftModal(false);
    // Aquí llamarías a shiftService.createShift(shiftData)
  };

  const handleCloseShiftModal = () => {
    setShowShiftModal(false);
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      employee: '',
      area: '',
      role: '',
      type: ''
    });
    if (calendarRef.current) {
      calendarRef.current.getApi().today();
    }
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const handleItemClick = (itemId) => setActiveItem(itemId);

  return (
    <div className="time-schedule-page-container">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar} 
        activeItem={activeItem} 
        onItemClick={handleItemClick} 
        menuItems={menuItems}
      />
      
      <div className={`time-schedule-main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <Header onToggleSidebar={toggleSidebar} pageTitle="Gestión de Disponibilidad" />
        <div className="time-schedule-content-area">
          {/* Statistics */}
          <TimeScheduleStats availabilities={filteredData} />

          {/* Filter Section */}
          <div className="time-schedule-filter-toggle-wrap">
            <button
              type="button"
              className="time-schedule-filter-toggle"
              onClick={() => setShowFilters((prev) => !prev)}
            >
              <MdTune size={20} />
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </button>
          </div>

          {showFilters && (
            <TimeScheduleFilter 
              onFilterChange={handleFilterChange} 
              filters={filters}
              onReset={handleResetFilters}
            />
          )}

          {/* Main Content */}
          {filteredData.length === 0 ? (
            <div className="time-schedule-empty-state">
              <div className="time-schedule-empty-icon"><MdInbox size={36} /></div>
              <h3 className="time-schedule-empty-title">No hay disponibilidades</h3>
              <p className="time-schedule-empty-description">
                No hay disponibilidades para el rango seleccionado. Ajusta los filtros para ver más resultados.
              </p>
              <button 
                className="time-schedule-empty-button"
                onClick={handleResetFilters}
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            <div className="time-schedule-content-grid">
              {/* Calendar View */}
              <div className="time-schedule-calendar-section">
                <div className="time-schedule-section-header">
                  <div className="time-schedule-section-icon"><MdCalendarToday size={25} /></div>
                  <div>
                    <h2 className="time-schedule-section-title">Vista de Calendario</h2>
                    <p className="time-schedule-section-subtitle">
                      {filteredData.length} registro{filteredData.length !== 1 ? 's' : ''} de disponibilidad
                    </p>
                  </div>
                </div>

                <div className="time-schedule-fullcalendar-wrapper">
                  <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    locale={esLocale}
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    events={calendarEvents}
                    eventClick={handleEventClick}
                    eventOverlap={false}
                    slotEventOverlap={false}
                    eventDidMount={(info) => {
                      const type = info.event.extendedProps.type;
                      const bg = info.event.extendedProps.adminResolvedColor || (type === 'available' ? ADMIN_AVAILABILITY_COLORS.available : ADMIN_AVAILABILITY_COLORS.unavailable);
                      try {
                        info.el.style.backgroundColor = bg;
                        info.el.style.borderColor = bg;
                        info.el.style.borderLeftColor = bg;
                        info.el.style.borderLeftWidth = '5px';
                        info.el.style.borderRadius = '8px';
                      } catch {
                        // ignore
                      }
                    }}
                    height="100%"
                    expandRows={false}
                    slotMinTime="00:00:00"
                    slotMaxTime="24:00:00"
                    allDaySlot={false}
                    nowIndicator={true}
                    scrollTime="08:00:00"
                    scrollTimeReset={false}
                    slotDuration="00:30:00"
                    dayMaxEvents={false}  
                    displayEventTime={true}
                    views={{
                      dayGridMonth: {
                        height: 'auto'
                      },
                      timeGridWeek: {
                        height: '100%'
                      },
                      timeGridDay: {
                        height: '100%'
                      }
                    }}
                    eventTimeFormat={{
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    }}
                    // Mostrar solo el nombre corto del día en la cabecera
                    // para evitar que se muestren múltiples formatos de fecha
                    // concatenados en la vista semanal/día.
                    dayHeaderFormat={{ weekday: 'short' }}
                    buttonText={{
                      today: 'Hoy',
                      month: 'Mes',
                      week: 'Semana',
                      day: 'Día'
                    }}
                    eventContent={(eventInfo) => {
                      const viewType = eventInfo.view?.type || '';
                      const isMonthView = viewType === 'dayGridMonth';
                      const isWeekView = viewType === 'timeGridWeek';
                      const isDayView = viewType === 'timeGridDay';
                      const employeeName = eventInfo.event.extendedProps.employee_name || eventInfo.event.title || 'Sin nombre';
                      const employeeRole = eventInfo.event.extendedProps.employee_position || 'Sin puesto';
                      const rawDisplayNumber = eventInfo.event.extendedProps.displayNumber;
                      const displayNumber = Number.isFinite(Number(rawDisplayNumber))
                        ? Number(rawDisplayNumber)
                        : '';
                      const hourRange = formatEventHourRange(
                        eventInfo.event.extendedProps.start_time,
                        eventInfo.event.extendedProps.end_time
                      );

                      if (isMonthView) {
                        return (
                          <div className="time-schedule-event-content time-schedule-event-content-month">
                            <div className="time-schedule-event-number">#{displayNumber}</div>
                            <div className="time-schedule-event-title">{employeeName}</div>
                          </div>
                        );
                      }

                      if (isWeekView) {
                        return (
                          <div className="time-schedule-event-content time-schedule-event-content-number-only">
                            <div className="time-schedule-event-number">#{displayNumber}</div>
                          </div>
                        );
                      }

                      if (isDayView) {
                        return (
                          <div className="time-schedule-event-content time-schedule-event-content-week">
                            <div className="time-schedule-event-number">#{displayNumber}</div>
                            <div className="time-schedule-event-title">{employeeName}</div>
                            <div className="time-schedule-event-role">{employeeRole}</div>
                            <div className="time-schedule-event-time">
                              <MdAccessTime style={{ marginRight: 6 }} /> {hourRange}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="time-schedule-event-content">
                          <div className="time-schedule-event-title">
                            {employeeName}
                          </div>
                          <div className="time-schedule-event-time">
                            <MdAccessTime style={{ marginRight: 6 }} /> {hourRange}
                          </div>
                          <div className="time-schedule-event-area">
                            <MdBusiness style={{ marginRight: 6 }} /> {eventInfo.event.extendedProps.employee_area || 'Sin área'}
                          </div>
                        </div>
                      );
                    }}
                  />
                </div>
              </div>

              {/* List View */}
              <TimeScheduleList availabilities={filteredData} />
            </div>
          )}
        </div>

        {/* Details Modal */}
        {showDetails && (
          <TimeScheduleDetails 
            availability={selectedEvent}
            onClose={() => setShowDetails(false)}
            onAssign={handleAssignFromDetails}
          />
        )}

        {/* Shift modal */}
        <ShiftModal
          isOpen={showShiftModal}
          onClose={handleCloseShiftModal}
          onSave={handleSaveShift}
          shift={shiftToEdit}
          employees={employees}
          shiftTypes={shiftTypes}
          existingShifts={[]}
          unavailabilities={availabilities}
        />
      </div>
    </div>
  );
};

export default TimeSchedulePage;
