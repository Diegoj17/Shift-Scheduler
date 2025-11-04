// components/layout/ProfileLayout.jsx
import React, { useState } from 'react';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/common/Sidebar';
import SidebarEmployee from '../../../components/common/SidebarEmployee';
import employeeMenu from '../../../components/common/sidebarMenu';

import { useAuth } from '../../../contexts/AuthContext';
import '../../../styles/components/profile/layout/ProfileLayout.css';

const ProfileLayout = ({ children, pageTitle = 'Perfil' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { currentUser } = useAuth();

  // Determinar rol en mayúsculas (soporta distintos nombres de campo)
  const role = (currentUser?.role || currentUser?.user?.role || currentUser?.role_name || '').toString().toUpperCase();

  // Definir conjuntos de roles para decidir qué sidebar mostrar
  const employeeRoles = new Set(['EMPLEADO', 'EMPLOYEE']);
  const adminRoles = new Set(['ADMIN', 'GERENTE', 'MANAGER', 'ADMINISTRADOR']);


  const [activeItem, setActiveItem] = useState('');

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleItemClick = (id) => {
    setActiveItem(id);
  };

  // Menús por rol
  const adminMenuItems = [
    { id: 'dashboard', label: 'Inicio', icon: 'dashboard', path: '/admin/dashboard' },
    { id: 'calendario', label: 'Calendario', icon: 'calendar', path: '/admin/calendar' },
    { id: 'solicitudes', label: 'Solicitudes', icon: 'requests', path: '/admin/requests' },
    { id: 'presencia', label: 'Presencia', icon: 'presence', path: '/admin/attendance' },
    { id: 'documentos', label: 'Documentos', icon: 'documents', path: '/admin/documents' },
    { id: 'equipo', label: 'Equipo', icon: 'team', path: '/admin/management' },
    { id: 'informes', label: 'Informes', icon: 'reports', path: '/admin/reports' },
  ];

  return (
    <div className="profile-layout-container">
      {employeeRoles.has(role) ? (
        <SidebarEmployee
          isOpen={sidebarOpen}
          onToggle={toggleSidebar}
          activeItem={activeItem}
          onItemClick={handleItemClick}
          menuItems={employeeMenu}
        />
      ) : adminRoles.has(role) ? (
        <Sidebar 
          isOpen={sidebarOpen} 
          onToggle={toggleSidebar} 
          activeItem={activeItem}
          onItemClick={handleItemClick}
          menuItems={adminMenuItems}
        />
      ) : (
        /* Fallback: si el rol es desconocido, usar el Sidebar de admin por defecto */
        <Sidebar 
          isOpen={sidebarOpen} 
          onToggle={toggleSidebar} 
          activeItem={activeItem}
          onItemClick={handleItemClick}
          menuItems={adminMenuItems}
        />
      )}

      <div className={`profile-main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <Header 
          onToggleSidebar={toggleSidebar} 
          pageTitle={pageTitle} 
        />

        <div className="profile-content-area">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ProfileLayout;