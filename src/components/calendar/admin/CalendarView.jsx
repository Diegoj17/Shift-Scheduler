import { useRef, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaCalendarDay, FaCalendarWeek } from "react-icons/fa";
import '../../../styles/components/calendar/admin/CalendarView.css';

const CalendarView = ({ events, onEventClick, onEventDrop, onDateClick}) => {
  const calendarRef = useRef(null);
  const [currentView, setCurrentView] = useState('dayGridMonth');
  const [currentTitle, setCurrentTitle] = useState('');

  useEffect(() => {
    let rafId;
    if (calendarRef.current) {
      // Ejecutar en el siguiente frame para evitar flushSync dentro del render
      rafId = requestAnimationFrame(() => {
        try {
          const calendarApi = calendarRef.current.getApi();
          calendarApi.updateSize();
        } catch (e) {
          // ignore
        }
      });
    }
    return () => { if (rafId) cancelAnimationFrame(rafId); };
  }, []);

  // Forzar re-render del calendario cuando cambian los eventos desde el padre
  useEffect(() => {
    let rafId;
    if (calendarRef.current) {
      // Ejecutar en un microtask/frame separado para evitar flushSync durante render
      rafId = requestAnimationFrame(() => {
        try {
          const api = calendarRef.current.getApi();
          // Para asegurar que FullCalendar actualice el DOM de los eventos
          if (typeof api.removeAllEvents === 'function') {
            api.removeAllEvents();
          }
          if (Array.isArray(events)) {
            events.forEach((ev) => {
              try {
                api.addEvent(ev);
              } catch (err) {
                // si un evento no es válido, ignorar y continuar
              }
            });
          }
          // Intentar rerender y render por compatibilidad
          if (typeof api.rerenderEvents === 'function') api.rerenderEvents();
          if (typeof api.render === 'function') api.render();
        } catch (err) {
          // ignore
        }
      });
    }
    return () => { if (rafId) cancelAnimationFrame(rafId); };
  }, [events]);

  const handleViewChange = (view) => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.changeView(view);
      setCurrentView(view);
      updateTitle();
    }
  };

  const handleToday = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().today();
      updateTitle();
    }
  };

  const handlePrev = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().prev();
      updateTitle();
    }
  };

  const handleNext = () => {
    if (calendarRef.current) {
      calendarRef.current.getApi().next();
      updateTitle();
    }
  };

  const updateTitle = () => {
    if (calendarRef.current) {
      setCurrentTitle(calendarRef.current.getApi().view.title);
    }
  };

  // ✅ CORREGIDO: Handler de click en eventos
  const handleEventClick = (info) => {
    console.log('🎯 [CalendarView] Event clicked:', {
      id: info.event.id,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      extendedProps: info.event.extendedProps
    });
    
    // Prevenir comportamiento por defecto
    if (info.jsEvent) {
      info.jsEvent.preventDefault();
      info.jsEvent.stopPropagation();
    }
    
    // Pasar el evento completo al padre
    if (onEventClick) {
      // ✅ Pasar el objeto event de FullCalendar directamente
      onEventClick(info.event);
    }
  };

  return (
    <div className="calendar-view-wrapper">
      <div className="calendar-custom-header">
        <div className="calendar-header-left">
          <button className="calendar-btn-nav" onClick={handlePrev} title="Anterior" aria-label="Anterior">
            <FaChevronLeft />
          </button>
          <button className="calendar-btn-nav" onClick={handleNext} title="Siguiente" aria-label="Siguiente">
            <FaChevronRight />
          </button>
          <button className="calendar-btn-today" onClick={handleToday}>
            <FaCalendarDay />
            <span>Hoy</span>
          </button>
          <h2 className="calendar-current-title">{currentTitle}</h2>
        </div>

        <div className="calendar-header-right">
          <div className="calendar-view-buttons">
            <button
              className={`calendar-btn-view ${currentView === 'dayGridMonth' ? 'calendar-btn-view-active' : ''}`}
              onClick={() => handleViewChange('dayGridMonth')}
              aria-pressed={currentView === 'dayGridMonth'}
              aria-label="Ver mes"
            >
              <FaCalendarAlt />
              <span>Mes</span>
            </button>
            <button
              className={`calendar-btn-view ${currentView === 'timeGridWeek' ? 'calendar-btn-view-active' : ''}`}
              onClick={() => handleViewChange('timeGridWeek')}
              aria-pressed={currentView === 'timeGridWeek'}
              aria-label="Ver semana"
            >
              <FaCalendarWeek />
              <span>Semana</span>
            </button>
            <button
              className={`calendar-btn-view ${currentView === 'timeGridDay' ? 'calendar-btn-view-active' : ''}`}
              onClick={() => handleViewChange('timeGridDay')}
              aria-pressed={currentView === 'timeGridDay'}
              aria-label="Ver día"
            >
              <FaCalendarDay />
              <span>Día</span>
            </button>
          </div>
        </div>
      </div>

      <div className="calendar-content">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={currentView}
          headerToolbar={false}
          events={events}
          
          editable={true}
          droppable={true}
          selectable={true}
          selectMirror={true}
          eventClick={handleEventClick}
          // Aplicar color personalizado por tipo de turno cuando el evento se monta
          eventDidMount={(info) => {
            try {
              const ev = info.event;
              const el = info.el;
              // Preferir extendedProps.color, fallback a backgroundColor
              const color = ev.extendedProps?.color || ev.backgroundColor || ev.extendedProps?.backgroundColor;
              if (color) {
                // Queremos que sólo la línea izquierda tenga el color (no todo el fondo)
                // Dejar el fondo blanco / por defecto y aplicar el borde izquierdo.
                el.style.backgroundColor = 'transparent';
                el.style.borderColor = '';
                el.style.borderLeftStyle = 'solid';
                el.style.borderLeftColor = color;
                el.style.borderLeftWidth = '5px';
                el.style.boxShadow = el.style.boxShadow || '0 2px 8px rgba(0,0,0,0.06)';

                // Aplicar color al título (texto) para que destaque en vez de colorear todo
                const title = el.querySelector('.calendar-event-title-text');
                if (title) title.style.color = color;
                // Mantener el resto del texto más tenue
                const timeText = el.querySelector('.calendar-event-time-text');
                if (timeText) timeText.style.color = '#475569';
              }
            } catch (err) {
              // ignore
            }
          }}
          
          dayMaxEventRows={3}
          eventMaxStack={3}
          slotEventOverlap={false}
          eventOverlap={false}
          
          weekends={true}
          eventDrop={onEventDrop}
          dateClick={(info) => onDateClick && onDateClick(info.date, info.dateStr)}
          datesSet={updateTitle}
          height="100%"
          locale="es"
          
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }}
          
          eventContent={(eventInfo) => renderEventContent(eventInfo)}
          
          slotMinTime="06:00:00"
          slotMaxTime="24:00:00"
          slotDuration="00:30:00"
          allDaySlot={false}
          nowIndicator={true}
          
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: '08:00',
            endTime: '18:00'
          }}
          
          eventMouseEnter={(info) => {
            info.el.style.zIndex = '1000';
            info.el.style.cursor = 'pointer';
          }}
          eventMouseLeave={(info) => {
            info.el.style.zIndex = '';
          }}
        />
      </div>
    </div>
  );
};

// Utilidad para decidir si un color hex es claro
function isColorLight(hex) {
  if (!hex) return false;
  // aceptar formatos: #rrggbb o rgb(...)
  let r, g, b;
  try {
    if (hex.startsWith('rgb')) {
      const parts = hex.match(/\d+/g);
      if (parts && parts.length >= 3) {
        r = Number(parts[0]); g = Number(parts[1]); b = Number(parts[2]);
      }
    } else {
      const clean = hex.replace('#', '').trim();
      if (clean.length === 3) {
        r = parseInt(clean[0] + clean[0], 16);
        g = parseInt(clean[1] + clean[1], 16);
        b = parseInt(clean[2] + clean[2], 16);
      } else if (clean.length === 6) {
        r = parseInt(clean.substring(0,2), 16);
        g = parseInt(clean.substring(2,4), 16);
        b = parseInt(clean.substring(4,6), 16);
      }
    }
    if (r == null) return false;
    // calcular luminancia relativa
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance > 0.6; // umbral: si es alto, el color es claro
  } catch (e) {
    return false;
  }
}

function renderEventContent(eventInfo) {
  const { event } = eventInfo;
  const view = eventInfo.view.type;
  
  return (
    <div className="calendar-custom-event-content" style={{ pointerEvents: 'none' }}>
      <div className="calendar-event-title-text">{event.title}</div>
      {view !== 'dayGridMonth' && (
        <div className="calendar-event-time-text">{eventInfo.timeText}</div>
      )}
      {event.extendedProps.role && view === 'timeGridDay' && (
        <div className="calendar-event-role-text">{event.extendedProps.role}</div>
      )}
    </div>
  );
}

export default CalendarView;