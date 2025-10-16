import { useState } from 'react';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import DashboardHeader from '../../modules/admin/dashboard/components/DashboardHeader';
import StatsGrid from '../../modules/admin/dashboard/components/StatsGrid';
import WelcomeWidgets from '../../modules/admin/dashboard/components/WelcomeWidgets';
import DayShift from '../../modules/admin/dashboard/components/DayShift';
import ShiftDistribution from '../../modules/admin/dashboard/components/ShiftDistribution';
import Request from '../../modules/admin/dashboard/components/Request';
import UpcomingShifts from '../../modules/admin/dashboard/components/UpcomingShifts';
import '/src/styles/pages/admin/DashboardPage.css';

const DashboardPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState("dashboard");

  const menuItems = [
    { id: "dashboard", label: "Inicio", icon: "dashboard" },
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

  const handleItemClick = (itemId) => {
    setActiveItem(itemId);
  };

  const currentPageTitle = menuItems.find((item) => item.id === activeItem)?.label || "Dashboard";

  return (
    <div className="dashboard-container">
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar} 
        activeItem={activeItem} 
        onItemClick={handleItemClick} 
        menuItems={menuItems}
      />

      <div className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <Header onToggleSidebar={toggleSidebar} pageTitle={currentPageTitle} />

        <div className="content-area">
          {activeItem === "dashboard" && (
            <>
              {/* Header Section */}
              <div className="dashboard-header-section">
                <DashboardHeader />
              </div>

              {/* Stats Overview */}
              <div className="stats-section">
                <StatsGrid />
              </div>

              {/* Main Dashboard Grid */}
              <div className="dashboard-main-grid">
                {/* Left Column - Primary Content */}
                <div className="dashboard-primary-column">
                  <div className="primary-content-card">
                    <WelcomeWidgets />
                  </div>

                  <div className="primary-content-card">
                    <DayShift />
                  </div>

                  <div className="primary-content-card">
                    <UpcomingShifts />
                  </div>
                  
                </div>

                {/* Right Column - Secondary Content */}
                <div className="dashboard-secondary-column">
                  <div className="secondary-content-card">
                    <Request />
                  </div>

                  <div className="secondary-content-card">
                    <ShiftDistribution />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;