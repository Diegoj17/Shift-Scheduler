import React, { useState } from 'react';
import { FaUser, FaBuilding } from 'react-icons/fa';
import Sidebar from '../../components/common/Sidebar';
import Header from '../../components/common/Header';
import EmployeeHoursReport from '../../components/reports/EmployeeHoursReport';
import DepartmentHoursReport from '../../components/reports/DepartmentHoursReport';
import '../../styles/pages/admin/ReportsPage.css';

const ReportsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState("informes");
  const [activeReport, setActiveReport] = useState("employee"); // "employee" | "department"

  const menuItems = [
    { id: "dashboard", label: "Inicio", icon: "dashboard" },
    { id: "calendario", label: "Calendario", icon: "calendar" },
    { id: "disponibilidad", label: "Disponibilidad", icon: "availability" },
    { id: "solicitudes", label: "Solicitudes", icon: "requests" },
    { id: "equipo", label: "Equipo", icon: "team" },
    { id: "informes", label: "Informes", icon: "reports" },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const handleItemClick = (itemId) => setActiveItem(itemId);

  return (
    <div className="reports-time-page-container">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar} 
        activeItem={activeItem} 
        onItemClick={handleItemClick} 
        menuItems={menuItems}
      />
      
      <div className={`reports-time-main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <Header onToggleSidebar={toggleSidebar} pageTitle="Informes de Horas Trabajadas" />
        
        <div className="reports-time-content-area">
          {/* Submenu de selección de reporte */}
          <div className="reports-time-submenu">
            <button
              className={`reports-time-submenu-btn ${activeReport === 'employee' ? 'active' : ''}`}
              onClick={() => setActiveReport('employee')}
            >
              <FaUser className="reports-time-submenu-icon" />
              <span>Reporte por Empleado</span>
            </button>
            <button
              className={`reports-time-submenu-btn ${activeReport === 'department' ? 'active' : ''}`}
              onClick={() => setActiveReport('department')}
            >
              <FaBuilding className="reports-time-submenu-icon" />
              <span>Reporte por Área/Departamento</span>
            </button>
          </div>

          {/* Contenido del reporte */}
          <div className="reports-time-content">
            {activeReport === 'employee' ? (
              <EmployeeHoursReport />
            ) : (
              <DepartmentHoursReport />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;