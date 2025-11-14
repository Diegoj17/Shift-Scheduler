import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarEmployee from '../../components/common/SidebarEmployee';
import Header from '../../components/common/Header';
import ShiftChangeRequestForm from '../../components/request/user/ShiftChangeRequestForm';
import ShiftChangeRequestHistory from '../../components/request/user/ShiftChangeRequestHistory';
import '../../styles/pages/user/ShiftChangeRequestPage.css';

const ShiftChangeRequestPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState("solicitudes");
  const [activeTab, setActiveTab] = useState('solicitar'); 
  const navigate = useNavigate();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const handleItemClick = (itemId) => setActiveItem(itemId);

  return (
    <div className="shift-change-page-container">
      <SidebarEmployee 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar} 
        activeItem={activeItem} 
        onItemClick={handleItemClick}
        darkMode={false}
      />

      <div className={`shift-change-main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <Header onToggleSidebar={toggleSidebar} pageTitle="Cambio de Turno" />
    
        <div className="shift-change-content-area">
          {/* Tabs */}
          <div className="shift-change-tabs">
            <button
              className={`shift-change-tab ${activeTab === 'solicitar' ? 'active' : ''}`}
              onClick={() => setActiveTab('solicitar')}
            >
              Solicitar Cambio
            </button>
            <button
              className={`shift-change-tab ${activeTab === 'historial' ? 'active' : ''}`}
              onClick={() => setActiveTab('historial')}
            >
              Mis Solicitudes
            </button>
          </div>

          {/* Content */}
          <div className="shift-change-tab-content">
            {activeTab === 'solicitar' && <ShiftChangeRequestForm />}
            {activeTab === 'historial' && <ShiftChangeRequestHistory />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShiftChangeRequestPage;