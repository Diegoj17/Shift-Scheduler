import React, { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { FaSyncAlt, FaClock, FaCalendarAlt, FaExclamationTriangle, FaClipboardList, FaMoneyBillWave, FaBullhorn } from 'react-icons/fa';
import WelcomeCard from '../../modules/user/dashboard/components/WelcomeCard';
import TodayScheduleCard from '../../modules/user/dashboard/components/TodayScheduleCard';
import QuickActionsCard from '../../modules/user/dashboard/components/QuickActionsCard';
import UpcomingShiftsCard from '../../modules/user/dashboard/components/UpcomingShiftsCard';
import MonthlyStatsCard from '../../modules/user/dashboard/components/MonthlyStatsCard';
import RemindersCard from '../../modules/user/dashboard/components/RemindersCard';
import '@/styles/components/dashboard/user/WelcomeCard.css';

const MainPage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  // Estado local para controlar el sidebar (abierto / colapsado)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [employee] = useState({
    name: 'María González',
    position: 'Supervisor de Turnos',
    department: 'Recursos Humanos',
    employeeId: 'EMP-2345'
  });
  
  const [todaySchedule] = useState({
    shift: 'Matutino (08:00 - 16:00)',
    status: 'Activo',
    nextBreak: '10:30 - 10:45'
  });

  const [upcomingShifts] = useState([
    { date: '2024-01-15', shift: 'Matutino', hours: '08:00 - 16:00' },
    { date: '2024-01-16', shift: 'Vespertino', hours: '16:00 - 00:00' },
    { date: '2024-01-17', shift: 'Matutino', hours: '08:00 - 16:00' },
    { date: '2024-01-18', shift: 'Libre', hours: '-' }
  ]);

  const [quickActions] = useState([
    { id: 1, title: 'Solicitar Cambio', icon: <FaSyncAlt />, color: '#4CAF50' },
    { id: 2, title: 'Registrar Horas', icon: <FaClock />, color: '#2196F3' },
    { id: 3, title: 'Ver Calendario', icon: <FaCalendarAlt />, color: '#FF9800' },
    { id: 4, title: 'Reportar Incidencia', icon: <FaExclamationTriangle />, color: '#F44336' }
  ]);

  const [monthlyStats] = useState({
    hoursWorked: 152,
    shiftsCompleted: 5,
    punctuality: '98%'
  });

  const [reminders] = useState([
    { icon: <FaClipboardList />, text: 'Revisión trimestral programada para el 25 de Enero' },
    { icon: <FaMoneyBillWave />, text: 'Nómina disponible para consulta' },
    { icon: <FaBullhorn />, text: 'Objetivos del mes: 85% completado' }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleActionClick = (actionId) => {
    const action = quickActions.find(a => a.id === actionId);
    alert(`Acción seleccionada: ${action.title}`);
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleClockAction = () => {
    alert('Registrando entrada/salida...');
  };

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={isSidebarOpen} onToggle={handleToggleSidebar} />

      <div className={`main-content ${!isSidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <Header employee={employee} onToggleSidebar={handleToggleSidebar} pageTitle={`Inicio`} />

        <div className="content-area">
          <div className="dashboard-header-section">
            {/* espacio para título o widgets superiores si necesario */}
          </div>

          <div className="dashboard-main-grid">
            <div className="dashboard-primary-column">
              {/* Welcome grande en la parte superior */}
              <div className="primary-item">
                <WelcomeCard employeeName={employee.name} currentTime={currentTime} />
              </div>

              {/* Acciones rápidas justo debajo del welcome */}
              <div className="primary-item">
                <QuickActionsCard actions={quickActions} onActionClick={handleActionClick} />
              </div>
            </div>

            <div className="dashboard-secondary-column">
              {/* Turno de Hoy en la columna derecha, alineado al tope */}
              <div className="secondary-item">
                <TodayScheduleCard schedule={todaySchedule} onClockAction={handleClockAction} />
              </div>

              {/* Puedes agregar otros widgets secundarios aquí */}
            </div>

            {/* Grid inferior con Próximos Turnos y Estadísticas y Recordatorios
                ahora está fuera de la columna primaria para poder ocupar todo el ancho */}
            <div className="lower-grid">
              <div className="lower-grid-item">
                <UpcomingShiftsCard shifts={upcomingShifts} />
              </div>

              <div className="lower-grid-item">
                <MonthlyStatsCard stats={monthlyStats} />
              </div>

              <div className="lower-grid-item">
                <RemindersCard reminders={reminders} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;