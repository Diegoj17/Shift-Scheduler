import React from 'react';
import { HiOutlineCalendar, HiOutlineClipboardList, HiOutlineChartBar, HiOutlineUsers, HiOutlineClock } from 'react-icons/hi';
import { FaBolt } from 'react-icons/fa';
import { FaArrowRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../../../styles/components/dashboard/admin/WelcomeWidgets.css';

const WelcomeWidgets = () => {
  const widgets = [
    {
      icon: <HiOutlineCalendar />,
      title: "Gestión de Turnos",
      description: "Organiza y gestiona los turnos de tu equipo de forma eficiente.",
      path: '/admin/calendar'
    },
    {
      icon: <HiOutlineClock />,
      title: "Disponibilidad",
      description: "Administra la disponibilidad y horarios del equipo.",
      path: '/admin/availability'
    },
    {
      icon: <HiOutlineClipboardList />,
      title: "Solicitudes",
      description: "Revisa y aprueba las solicitudes de cambios de turno."
      ,
      path: '/admin/shift-change-review'
    },
    {
      icon: <HiOutlineUsers />,
      title: "Equipo",
      description: "Gestiona los miembros de tu equipo y sus horarios.",
      path: '/admin/management'
    },
    {
      icon: <HiOutlineChartBar />,
      title: "Reportes",
      description: "Genera reportes detallados de asistencia y horarios.",
      path: '/admin/reports'
    }
  ];
  const navigate = useNavigate();

  return (
    <div className="widgets-section">
      <h3 className="section-title">
        <span className="section-title-accent" aria-hidden="true"></span>
        <span className="section-icon-wrapper">
          <FaBolt className="section-icon" />
        </span>
        Acciones Rápidas
      </h3>
      <div className="welcome-widgets">
        {widgets.map((widget, index) => (
          <div
            key={index}
            className={`welcome-card ${widget.path ? 'clickable' : ''}`}
            role={widget.path ? 'button' : undefined}
            tabIndex={widget.path ? 0 : undefined}
            onClick={() => widget.path && navigate(widget.path)}
            onKeyPress={(e) => { if (widget.path && (e.key === 'Enter' || e.key === ' ')) navigate(widget.path); }}
          >
            <div className="card-icon">
              {widget.icon}
            </div>
            <div className="card-content">
              <h3>{widget.title}</h3>
              <p>{widget.description}</p>
            </div>
            <div className="card-arrow">
              <FaArrowRight />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WelcomeWidgets;
