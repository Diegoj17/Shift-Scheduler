// components/management/StatsCards.jsx
import React from 'react';
import { 
  FaUserPlus, 
  FaUserCheck, 
  FaUserTimes, 
  FaLock 
} from "react-icons/fa";
import '../../styles/components/management/StatsCards.css';

const StatsCards = ({ users }) => {
  const stats = [
    {
      key: 'total',
      label: 'Total Usuarios',
      value: users.length,
      icon: <FaUserPlus />,
      className: 'total-users'
    },
    {
      key: 'active',
      label: 'Usuarios Activos',
      value: users.filter(u => u.status === 'active').length,
      icon: <FaUserCheck />,
      className: 'active-users'
    },
    {
      key: 'inactive',
      label: 'Usuarios Inactivos',
      value: users.filter(u => u.status === 'inactive').length,
      icon: <FaUserTimes />,
      className: 'inactive-users'
    },
    {
      key: 'blocked',
      label: 'Usuarios Bloqueados',
      value: users.filter(u => u.status === 'blocked').length,
      icon: <FaLock />,
      className: 'blocked-users'
    }
  ];

  return (
    <div className="management-stats-grid">
        {stats.map(stat => (
          <div key={stat.key} className="management-stat-card">
            <div className={`management-stat-icon ${stat.className}`}>
              {stat.icon}
            </div>
            <div className="management-stat-content">
              <div className="management-stat-label">{stat.label}</div>
              <div className="management-stat-value">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>
  );
};

export default StatsCards;