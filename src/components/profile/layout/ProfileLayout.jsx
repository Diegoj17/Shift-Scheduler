// components/layout/ProfileLayout.jsx
import React, { useState } from 'react';
import Header from '../../../components/common/Header';
import Sidebar from '../../../components/common/Sidebar';
import '../../../styles/components/profile/layout/ProfileLayout.css';

const ProfileLayout = ({ children, pageTitle = 'Perfil' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard" },
    { id: "calendario", label: "Calendario", icon: "calendar" },
    { id: "solicitudes", label: "Solicitudes", icon: "requests" },
    { id: "presencia", label: "Presencia", icon: "presence" },
    { id: "documentos", label: "Documentos", icon: "documents" },
    { id: "equipo", label: "Equipo", icon: "team" },
    { id: "informes", label: "Informes", icon: "reports" },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="profile-layout-container">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar} 
        activeItem="profile"
        menuItems={menuItems}
      />

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