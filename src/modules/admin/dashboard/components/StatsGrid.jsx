// components/dashboard/StatsGrid.jsx
import React from 'react';
import { FaClock, FaClipboardList, FaUsers, FaUserCheck } from 'react-icons/fa';
import '../../../../styles/components/dashboard/StatsGrid.css';

const StatsGrid = () => {
  const statsData = [
    { 
      title: "Turnos Activos", 
      value: "24", 
      change: "+2", 
      icon: <FaClock />, 
      color: "blue" 
    },
    { 
      title: "Solicitudes Pendientes", 
      value: "8", 
      change: "-3", 
      icon: <FaClipboardList />, 
      color: "orange" 
    },
    { 
      title: "Miembros del Equipo", 
      value: "15", 
      change: "+1", 
      icon: <FaUsers />, 
      color: "green" 
    },
    { 
      title: "Asistencia del Mes", 
      value: "94%", 
      change: "+2%", 
      icon: <FaUserCheck />, 
      color: "purple" 
    }
  ];

  return (
    <div className="stats-grid">
      {statsData.map((stat, index) => (
        <div key={index} className={`stat-card stat-${stat.color}`}>
          <div className="stat-icon">
            {stat.icon}
          </div>
          <div className="stat-content">
            <h3>{stat.value}</h3>
            <p>{stat.title}</p>
          </div>
          <div className="stat-change">
            <span>{stat.change}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsGrid;