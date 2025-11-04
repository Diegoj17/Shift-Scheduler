import React from 'react';
import { HiOutlineCalendar, HiOutlineClipboardList, HiOutlineChartBar, HiOutlineUsers } from 'react-icons/hi';
import { FaArrowRight } from 'react-icons/fa';
import '../../../styles/components/dashboard/admin/WelcomeWidgets.css';

const WelcomeWidgets = () => {
  const widgets = [
    {
      icon: <HiOutlineCalendar />,
      title: "Gestión de Turnos",
      description: "Organiza y gestiona los turnos de tu equipo de forma eficiente."
    },
    {
      icon: <HiOutlineClipboardList />,
      title: "Solicitudes",
      description: "Revisa y aprueba las solicitudes de cambios de turno."
    },
    {
      icon: <HiOutlineChartBar />,
      title: "Reportes",
      description: "Genera reportes detallados de asistencia y horarios."
    },
    {
      icon: <HiOutlineUsers />,
      title: "Equipo",
      description: "Gestiona los miembros de tu equipo y sus horarios."
    }
  ];

  return (
    <div className="widgets-section">
      <h3 className="section-title">
        <HiOutlineCalendar className="section-icon" />
        Acciones Rápidas
      </h3>
      <div className="welcome-widgets">
        {widgets.map((widget, index) => (
          <div key={index} className="welcome-card">
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