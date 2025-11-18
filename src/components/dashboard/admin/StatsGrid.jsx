// components/dashboard/StatsGrid.jsx
import React, { useEffect, useState } from 'react';
import { FaClock, FaClipboardList, FaUsers, FaUserCheck } from 'react-icons/fa';
import '../../../styles/components/dashboard/admin/StatsGrid.css';
import { userService } from '../../../services/userService';
import { shiftService } from '../../../services/shiftService';
import shiftChangeService from '../../../services/shiftChangeService';

const StatsGrid = () => {
  const [usersCount, setUsersCount] = useState('...');
  const [shiftsCount, setShiftsCount] = useState('...');
  const [pendingRequestsCount, setPendingRequestsCount] = useState('...');

  useEffect(() => {
    let mounted = true;
    const fetchUsersCount = async () => {
      try {
        setUsersCount('...');
        const users = await userService.getUsers();
        if (!mounted) return;
        setUsersCount(Array.isArray(users) ? users.length : (users?.length ?? 0));
      } catch (error) {
        console.error('Error cargando usuarios:', error);
        if (mounted) setUsersCount(0);
      }
    };

    const fetchShiftsCount = async () => {
      try {
        setShiftsCount('...');
        const resp = await shiftService.getShifts();
        // resp puede ser un array o un objeto con .results o .data
        const data = Array.isArray(resp) ? resp : (resp?.results || resp?.data || []);
        const count = Array.isArray(data) ? data.length : 0;
        if (!mounted) return;
        setShiftsCount(count);
      } catch (error) {
        console.error('Error cargando turnos:', error);
        if (mounted) setShiftsCount(0);
      }
    };

    fetchUsersCount();
    fetchShiftsCount();
    const fetchPendingRequests = async () => {
      try {
        setPendingRequestsCount('...');
        const data = await shiftChangeService.getChangeRequests({ status: 'pending' });
        const list = Array.isArray(data) ? data : (data?.results || data?.data || []);
        const count = Array.isArray(list) ? list.length : 0;
        if (!mounted) return;
        setPendingRequestsCount(count);
      } catch (error) {
        console.error('Error cargando solicitudes pendientes:', error);
        if (mounted) setPendingRequestsCount(0);
      }
    };

    fetchPendingRequests();
    return () => { mounted = false; };
  }, []);

  const statsData = [
    { 
      title: "Turnos Activos", 
      value: shiftsCount, 
      change: "+2", 
      icon: <FaClock />, 
      color: "blue" 
    },
    { 
      title: "Solicitudes Pendientes", 
      value: pendingRequestsCount, 
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