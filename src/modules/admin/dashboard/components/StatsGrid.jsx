// components/dashboard/StatsGrid.jsx
import React, { useEffect, useState } from 'react';
import { FaClock, FaClipboardList, FaUsers, FaUserCheck } from 'react-icons/fa';
import '../../../../styles/components/dashboard/StatsGrid.css';
import { userService } from '../../../../services/userService';

const StatsGrid = () => {
  const [usersCount, setUsersCount] = useState('...');

  useEffect(() => {
    let mounted = true;
    const fetchUsersCount = async () => {
      try {
        // mostrar indicador de carga breve
        setUsersCount('...');
        const users = await userService.getUsers();
        if (!mounted) return;
        setUsersCount(Array.isArray(users) ? users.length : (users?.length ?? 0));
      } catch (error) {
        console.error('Error cargando usuarios:', error);
        if (mounted) setUsersCount(0);
      }
    };

    fetchUsersCount();
    return () => { mounted = false; };
  }, []);

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
      value: usersCount, 
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