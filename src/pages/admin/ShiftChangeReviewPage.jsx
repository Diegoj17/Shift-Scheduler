import React, { useState } from 'react';
import Sidebar from '../../components/common/Sidebar';
import Header from '../../components/common/Header';
import ShiftChangeRequestList from '../../components/request/admin/ShiftChangeRequestList';
import '../../styles/pages/admin/ShiftChangeReviewPage.css';

const ShiftChangeReviewPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState("solicitudes");

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const handleItemClick = (itemId) => setActiveItem(itemId);

  return (
    <div className="shift-review-page-container">
      <Sidebar
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar} 
        activeItem={activeItem} 
        onItemClick={handleItemClick}
        darkMode={false}
      />

      <div className={`shift-review-main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <Header onToggleSidebar={toggleSidebar} pageTitle="Solicitudes de Cambio de Turno" />
    
        <div className="shift-review-content-area">
          <ShiftChangeRequestList />
        </div>
      </div>
    </div>
  );
};

export default ShiftChangeReviewPage;