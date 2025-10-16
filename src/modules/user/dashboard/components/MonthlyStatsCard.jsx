import React from 'react';
import { FaClock, FaCheckCircle, FaChartLine } from 'react-icons/fa';
import '../../../../styles/components/dashboard/user/MonthlyStatsCard.css';

const MonthlyStatsCard = ({ stats = {} }) => {
  const statItems = [
    { 
      value: stats.hoursWorked ?? 0, 
      label: 'Horas Trabajadas', 
      icon: <FaClock />, 
      color: '#2563eb' 
    },
    { 
      value: stats.shiftsCompleted ?? 0, 
      label: 'Turnos Completados', 
      icon: <FaCheckCircle />, 
      color: '#10b981' 
    },
    { 
      value: stats.punctuality ?? '0%', 
      label: 'Puntualidad', 
      icon: <FaChartLine />, 
      color: '#f59e0b' 
    }
  ];

  return (
    <div className="monthly-stats-widget">
      <h3 className="monthly-stats-heading">Estadísticas del Mes</h3>
      
      <div className="monthly-stats-metrics-grid">
        {statItems.map((stat, index) => (
          <div key={index} className="stats-metric-box" style={{ '--stat-color': stat.color }}>
            <div className="metric-icon-circle">
              <span className="metric-icon">{stat.icon}</span>
            </div>
            <div className="metric-value-display">{stat.value}</div>
            <div className="metric-label-text">{stat.label}</div>
            <div className="metric-progress-bar">
              <div className="metric-progress-fill" style={{ background: stat.color }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonthlyStatsCard;