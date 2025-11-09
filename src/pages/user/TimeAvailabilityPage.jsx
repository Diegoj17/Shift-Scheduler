import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { MdCalendarToday, MdCheckCircle, MdCancel } from 'react-icons/md';
import TimeAvailabilityForm from '../../components/time/user/availability/TimeAvailabilityForm';
import TimeAvailabilityList from '../../components/time/user/availability/TimeAvailabilityList';
import TimeAvailabilityNotification from '../../components/time/user/availability/TimeAvailabilityNotification';
import TimeAvailabilityStats from '../../components/time/user/availability/TimeAvailabilityStats';
import SidebarEmployee from '../../components/common/SidebarEmployee.jsx';
import Header from '../../components/common/Header.jsx';
import availabilityService, { AVAILABILITY_COLORS } from '../../services/availabilityService';
import '../../styles/pages/user/TimeAvailabilityPage.css';

const TimeAvailabilityPage = () => {

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState("registrar-disponibilidad");
  const calendarRef = useRef(null);
  const [notification, setNotification] = useState(null);
  const [availabilities, setAvailabilities] = useState([]);
  const [selectedAvailability, setSelectedAvailability] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Cargar disponibilidades al montar el componente
  useEffect(() => {
    loadAvailabilities();
  }, []);

  useEffect(() => {
    if (calendarRef.current) {
      setTimeout(() => {
        calendarRef.current.getApi().updateSize();
      }, 350);
    }
  }, [sidebarOpen]);

  const loadAvailabilities = async () => {
    setIsLoading(true);
    try {
      console.log('🔄 Cargando disponibilidades...');
      const data = await availabilityService.getAvailabilities();

      console.log('✅ Disponibilidades cargadas (raw):', data);

      // Normalizar la forma de cada disponibilidad para evitar inconsistencias
      const ensureSeconds = (t) => {
        if (!t) return '';
        const s = String(t).trim();
        if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s;
        if (/^\d{2}:\d{2}$/.test(s)) return `${s}:00`;
        const m = s.match(/(\d{2}:\d{2})/);
        return m ? `${m[1]}:00` : '';
      };

      const detectAvailable = (item) => {
        if (!item) return false;
        if (typeof item.available === 'boolean') return item.available;
        if (typeof item.is_available === 'boolean') return item.is_available;
        const raw = (item.type || item.status || item.value || '').toString().trim().toLowerCase();
        const truthy = ['available', 'disponible', 'true', '1', 'si', 'sí', 'yes', 'y'];
        return truthy.includes(raw);
      };

      const normalized = Array.isArray(data) ? data.map(av => {
        const id = av.id || av.availabilityId || av.pk || av._id || null;
        const date = av.date || av.day || av.availability_date || '';
        const rawStart = av.start_time || av.startTime || av.start || av.hora_inicio || '';
        const rawEnd = av.end_time || av.endTime || av.end || av.hora_fin || '';
        const startSec = ensureSeconds(rawStart);
        const endSec = ensureSeconds(rawEnd);
        const availableFlag = detectAvailable(av);
        const type = availableFlag ? 'available' : 'unavailable';

        return {
          // keep original fields for safety but ensure canonical ones exist
          ...av,
          id,
          date,
          start_time: startSec,
          end_time: endSec,
          startTime: startSec,
          endTime: endSec,
          type,
          available: availableFlag,
          notes: av.notes || av.note || av.comment || ''
        };
      }) : [];

      console.log('✅ Disponibilidades normalizadas:', normalized);
      setAvailabilities(normalized);
    } catch (error) {
      console.error('❌ Error al cargar disponibilidades:', error);
      showNotification('error', 'Error al cargar disponibilidades');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAvailability = (newAvailability) => {
    // Agregar al estado local
    setAvailabilities(prev => [...prev, newAvailability]);
    showNotification('success', 'Disponibilidad registrada exitosamente');
    
    // Actualizar calendario
    if (calendarRef.current) {
      calendarRef.current.getApi().refetchEvents();
    }
  };

  const handleUpdateAvailability = (updated) => {
    // Normalizar el objeto actualizado para mantener la forma canonical
    const ensureSeconds = (t) => {
      if (!t) return '';
      const s = String(t).trim();
      if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s;
      if (/^\d{2}:\d{2}$/.test(s)) return `${s}:00`;
      const m = s.match(/(\d{2}:\d{2})/);
      return m ? `${m[1]}:00` : '';
    };

    const detectAvailable = (item) => {
      if (!item) return false;
      if (typeof item.available === 'boolean') return item.available;
      if (typeof item.is_available === 'boolean') return item.is_available;
      const raw = (item.type || item.status || item.value || '').toString().trim().toLowerCase();
      const truthy = ['available', 'disponible', 'true', '1', 'si', 'sí', 'yes', 'y'];
      return truthy.includes(raw);
    };

    const normalizedUpdate = {
      ...updated,
      id: updated.id || updated.availabilityId || updated.pk || updated._id || null,
      date: updated.date || updated.day || updated.availability_date || updated.date,
      start_time: ensureSeconds(updated.start_time || updated.startTime || updated.start || ''),
      end_time: ensureSeconds(updated.end_time || updated.endTime || updated.end || ''),
    };
    normalizedUpdate.startTime = normalizedUpdate.start_time;
    normalizedUpdate.endTime = normalizedUpdate.end_time;
    normalizedUpdate.available = detectAvailable(normalizedUpdate);
    normalizedUpdate.type = normalizedUpdate.available ? 'available' : 'unavailable';

    // Actualizar en el estado local
    setAvailabilities(prev => 
      prev.map(av => av.id === normalizedUpdate.id ? { ...av, ...normalizedUpdate } : av)
    );
    showNotification('success', 'Disponibilidad actualizada exitosamente');
    setSelectedAvailability(null);
    
    // Actualizar calendario
    if (calendarRef.current) {
      calendarRef.current.getApi().refetchEvents();
    }
  };

  const handleDeleteAvailability = (id) => {
    // Eliminar del estado local
    setAvailabilities(prev => prev.filter(avail => avail.id !== id));
    showNotification('success', 'Disponibilidad eliminada correctamente');
    
    // Actualizar calendario
    if (calendarRef.current) {
      calendarRef.current.getApi().refetchEvents();
    }
  };

  const handleEventClick = (clickInfo) => {
    const eventId = parseInt(clickInfo.event.id, 10);
  // eslint-disable-next-line no-unused-vars
  const props = clickInfo.event.extendedProps || {};
    
    // Buscar la disponibilidad completa
    const availability = availabilities.find(av => av.id === eventId);
    
    if (availability) {
      const selected = {
        id: availability.id,
        date: availability.date,
        startTime: availability.start_time,
        endTime: availability.end_time,
        type: availability.type,
        notes: availability.notes || ''
      };
      
      setSelectedAvailability(selected);
      setActiveItem('registrar-disponibilidad');
    }
  };

  const handleCancelEdit = () => {
    setSelectedAvailability(null);
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // ✅ Convertir disponibilidades a eventos de FullCalendar
  const calendarEvents = availabilities.map(avail => ({
    id: avail.id.toString(),
    title: avail.type === 'available' ? '✓ Disponible' : '✕ No disponible',
    start: `${avail.date}T${avail.start_time}`,
    end: `${avail.date}T${avail.end_time}`,
    backgroundColor: avail.type === 'available' ? AVAILABILITY_COLORS.AVAILABLE : AVAILABILITY_COLORS.UNAVAILABLE,
    borderColor: avail.type === 'available' ? AVAILABILITY_COLORS.AVAILABLE : AVAILABILITY_COLORS.UNAVAILABLE,
    textColor: 'white',
    extendedProps: {
      type: avail.type,
      date: avail.date,
      startTime: avail.start_time,
      endTime: avail.end_time,
      notes: avail.notes
    }
  }));

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const handleItemClick = (itemId) => setActiveItem(itemId);

  return (
    <div className="time-availability-page-container">
      <SidebarEmployee 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar} 
        activeItem={activeItem} 
        onItemClick={handleItemClick}
        darkMode={false}
      />
    
    <div className={`time-availability-main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
      <Header onToggleSidebar={toggleSidebar} pageTitle="Registrar Disponibilidad" />
      
      <div className="time-availability-content-area">

        {/* Statistics */}
        <TimeAvailabilityStats availabilities={availabilities} />

        {/* Main Grid */}
        <div className="time-availability-grid">
          {/* Form Section */}
          <TimeAvailabilityForm
            onSubmit={handleAddAvailability}
            initialData={selectedAvailability}
            onUpdate={handleUpdateAvailability}
            onCancel={handleCancelEdit}
            onDelete={handleDeleteAvailability}
          />

          {/* Calendar Section with FullCalendar */}
          <div className="time-availability-calendar-card">
            <div className="time-availability-calendar-header">
              <div className="time-availability-calendar-icon"><MdCalendarToday size={25} /></div>
              <div>
                <h2 className="time-availability-calendar-title">Vista de Calendario</h2>
                <p className="time-availability-calendar-subtitle">
                  Visualiza tus disponibilidades registradas
                </p>
              </div>
            </div>

            <div className="time-availability-fullcalendar-wrapper">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale={esLocale}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek'
                }}
                events={calendarEvents}
                eventClick={handleEventClick}
                height="auto"
                eventDisplay="block"
                eventTimeFormat={{
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                }}
                eventDidMount={(info) => {
                  // Force background and border colors so month view reflects the type
                  const type = info.event.extendedProps.type;
                  const bg = type === 'available' ? '#38a169' : '#e53e3e';
                  const border = type === 'available' ? '#2f855a' : '#c53030';
                  try {
                    info.el.style.backgroundColor = bg;
                    info.el.style.borderColor = border;
                    info.el.style.color = 'white';
                    info.el.style.borderRadius = '10px';
                    info.el.style.boxShadow = '0 6px 16px rgba(0,0,0,0.06)';
                  } catch {
                    // ignore DOM errors
                  }
                }}
                dayHeaderFormat={{
                  weekday: 'short',
                  day: 'numeric'
                }}
                buttonText={{
                  today: 'Hoy',
                  month: 'Mes',
                  week: 'Semana',
                  day: 'Día'
                }}
                eventContent={(eventInfo) => {
                  // Return plain HTML (not React elements) to avoid React mounting inside
                  // FullCalendar-managed DOM nodes. This prevents reconciliation/insertBefore errors
                  // when FullCalendar reuses DOM elements.
                  try {
                    const type = eventInfo.event.extendedProps && eventInfo.event.extendedProps.type;
                    const label = type === 'available' ? 'Disponible' : 'No disponible';
                    const cls = type === 'available' ? 'available' : 'unavailable';
                    const timeText = eventInfo.timeText || '';
                    const html = `
                      <div class="time-availability-event-content ${cls}">
                        <div class="time-availability-event-title">${label}</div>
                        <div class="time-availability-event-time">${timeText}</div>
                      </div>
                    `;
                    return { html };
                  } catch (err) {
                    console.error('Error building eventContent HTML for availability:', err);
                    return { html: `<div class="time-availability-event-content"><div>${eventInfo.event.title}</div></div>` };
                  }
                }}
              />
            </div>

            <div className="time-availability-calendar-legend">
              <div className="time-availability-legend-item">
                <span className="time-availability-legend-dot available"></span>
                <span>Disponible</span>
              </div>
              <div className="time-availability-legend-item">
                <span className="time-availability-legend-dot unavailable"></span>
                <span>No disponible</span>
              </div>
            </div>
          </div>
        </div>

        {/* List Section */}
        <TimeAvailabilityList 
          availabilities={availabilities}
          onDelete={handleDeleteAvailability}
        />
      </div>

      {/* Notification */}
      {notification && (
        <TimeAvailabilityNotification 
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
    </div>
  );
};

export default TimeAvailabilityPage;