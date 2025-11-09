import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { MdCalendarToday, MdInbox, MdAccessTime, MdBusiness } from 'react-icons/md';
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

  const menuItems = [
    { id: "dashboard", label: "Inicio", icon: "dashboard" },
    { id: "calendario", label: "Calendario", icon: "calendar" },
    { id: "disponibilidad", label: "Disponibilidad", icon: "availability" },
    { id: "solicitudes", label: "Solicitudes", icon: "requests" },
    { id: "presencia", label: "Presencia", icon: "presence" },
    { id: "documentos", label: "Documentos", icon: "documents" },
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

      setAvailabilities(availData);
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
      console.log('🔄 Cargando disponibilidades con filtros:', filters);
      
      // Construir parámetros de consulta
      const params = {};
      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;
      if (filters.employee) params.employee = filters.employee;
      if (filters.type) params.type = filters.type;

      const data = await availabilityService.getAvailabilities(params);
      
      console.log('✅ Disponibilidades cargadas:', data.length);
      setAvailabilities(data);
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

  // ✅ Convertir disponibilidades a eventos de FullCalendar
  const calendarEvents = filteredData.map(avail => ({
    id: avail.id.toString(),
    title: `${avail.employee_name} - ${avail.employee_position}`,
    start: `${avail.date}T${avail.start_time}`,
    end: `${avail.date}T${avail.end_time}`,
    backgroundColor: avail.type === 'available' ? AVAILABILITY_COLORS.AVAILABLE : AVAILABILITY_COLORS.UNAVAILABLE,
    borderColor: avail.type === 'available' ? AVAILABILITY_COLORS.AVAILABLE : AVAILABILITY_COLORS.UNAVAILABLE,
    textColor: 'white',
    extendedProps: {
      ...avail
    }
  }));

  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event;
    setSelectedEvent(event.extendedProps);
    setShowDetails(true);
  };

  // En TimeSchedulePage.jsx - función handleAssignFromDetails

const handleAssignFromDetails = async (availability) => {
  console.log('🔍 [TimeSchedulePage] Disponibilidad recibida:', availability);
  
  setShowDetails(false);

  // ✅ CRÍTICO: Usar employee_id del backend (NO employee ni user_id)
  const employeeId = availability.employee_id;
  
  console.log('✅ [TimeSchedulePage] Employee ID a usar:', employeeId);
  console.log('📋 [TimeSchedulePage] Lista de empleados disponibles:', employees);

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

  console.log('📤 [TimeSchedulePage] Shift data preparado:', shift);

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
    console.log('🚀 [TimeSchedulePage] Abriendo ShiftModal con:', shift);
    setShowShiftModal(true);
  }, 160);
};

  const handleSaveShift = (shiftData) => {
    console.log('✅ Turno guardado:', shiftData);
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
          <TimeScheduleFilter 
            onFilterChange={handleFilterChange} 
            filters={filters}
            onReset={handleResetFilters}
          />

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
                    initialView="timeGridWeek"
                    locale={esLocale}
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    events={calendarEvents}
                    eventClick={handleEventClick}
                    eventDidMount={(info) => {
                      const type = info.event.extendedProps.type;
                      const bg = type === 'available' ? AVAILABILITY_COLORS.AVAILABLE : AVAILABILITY_COLORS.UNAVAILABLE;
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
                    height="auto"
                    slotMinTime="06:00:00"
                    slotMaxTime="24:00:00"
                    allDaySlot={false}
                    nowIndicator={true}
                    scrollTime="08:00:00"
                    slotDuration="01:00:00"
                    eventTimeFormat={{
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    }}
                    dayHeaderFormat={{
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short'
                    }}
                    buttonText={{
                      today: 'Hoy',
                      month: 'Mes',
                      week: 'Semana',
                      day: 'Día'
                    }}
                    eventContent={(eventInfo) => (
                      <div className="time-schedule-event-content">
                        <div className="time-schedule-event-title">
                          {eventInfo.event.title}
                        </div>
                        <div className="time-schedule-event-time">
                          <MdAccessTime style={{ marginRight: 6 }} /> {eventInfo.timeText}
                        </div>
                        <div className="time-schedule-event-area">
                          <MdBusiness style={{ marginRight: 6 }} /> {eventInfo.event.extendedProps.employee_area}
                        </div>
                      </div>
                    )}
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