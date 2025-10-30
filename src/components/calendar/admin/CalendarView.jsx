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
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.updateSize();
    }
  }, []);

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
          dayMaxEvents={3}
          weekends={true}
          eventDrop={onEventDrop}
          eventClick={(info) => {
            info.jsEvent.preventDefault();
            onEventClick && onEventClick(info.event);
          }}
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
          allDaySlot={false}
          nowIndicator={true}
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5],
            startTime: '08:00',
            endTime: '18:00'
          }}
        />
      </div>
    </div>
  );
};

function renderEventContent(eventInfo) {
  const { event } = eventInfo;
  const view = eventInfo.view.type;
  
  return (
    <div className="calendar-custom-event-content">
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