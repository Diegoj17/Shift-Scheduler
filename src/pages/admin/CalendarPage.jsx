import { useState, useEffect } from 'react';
import { FaPlus, FaCopy, FaClock, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import CalendarView from '../../components/calendar/admin/CalendarView';
import ShiftTypeManager from '../../components/calendar/admin/ShiftTypeManager';
import ShiftModal from '../../components/calendar/admin/ShiftModal';
import ShiftDuplicateModal from '../../components/calendar/admin/ShiftDuplicateModal';
import { timeStringToMinutes } from '../../utils/dateUtils';
import '/src/styles/pages/admin/DashboardPage.css';
import '../../styles/pages/admin/CalendarPage.css';

const CalendarPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState("calendario");
  const [shifts, setShifts] = useState([]);
  const [shiftTypes, setShiftTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [unavailabilities, _setUnavailabilities] = useState([]);
  
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isTypeManagerOpen, setIsTypeManagerOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [notification, setNotification] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const menuItems = [
    { id: "dashboard", label: "Inicio", icon: "dashboard" },
    { id: "calendario", label: "Calendario", icon: "calendar" },
    { id: "solicitudes", label: "Solicitudes", icon: "requests" },
    { id: "presencia", label: "Presencia", icon: "presence" },
    { id: "documentos", label: "Documentos", icon: "documents" },
    { id: "equipo", label: "Equipo", icon: "team" },
    { id: "informes", label: "Informes", icon: "reports" },
  ];

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = () => {
    const defaultShiftTypes = [
      { id: '1', name: 'Turno Mañana', startTime: '08:00', endTime: '16:00', color: '#667eea', createdAt: new Date().toISOString() },
      { id: '2', name: 'Turno Tarde', startTime: '16:00', endTime: '00:00', color: '#764ba2', createdAt: new Date().toISOString() },
      { id: '3', name: 'Turno Noche', startTime: '00:00', endTime: '08:00', color: '#4a5568', createdAt: new Date().toISOString() },
      { id: '4', name: 'Turno General', startTime: '09:00', endTime: '18:00', color: '#4caf50', createdAt: new Date().toISOString() }
    ];

    const defaultEmployees = [
      { id: '1', name: 'Juan Pérez', position: 'Desarrollador', department: 'TI', color: '#4f8cff' },
      { id: '2', name: 'María García', position: 'Diseñadora', department: 'Diseño', color: '#ff6b6b' },
      { id: '3', name: 'Carlos López', position: 'Gerente', department: 'Administración', color: '#4caf50' },
      { id: '4', name: 'Ana Martínez', position: 'Recursos Humanos', department: 'RH', color: '#ff9800' },
      { id: '5', name: 'Pedro Rodríguez', position: 'Contador', department: 'Finanzas', color: '#9c27b0' },
      { id: '6', name: 'Laura Sánchez', position: 'Marketing', department: 'Marketing', color: '#f44336' }
    ];

    const defaultDepartments = [
      { id: 'all', name: 'Todos los departamentos' },
      { id: 'TI', name: 'TI' },
      { id: 'Diseño', name: 'Diseño' },
      { id: 'Administración', name: 'Administración' },
      { id: 'RH', name: 'Recursos Humanos' },
      { id: 'Finanzas', name: 'Finanzas' },
      { id: 'Marketing', name: 'Marketing' }
    ];

    const today = new Date();
    const defaultShifts = [
      {
        id: '1',
        employeeId: '1',
        employeeName: 'Juan Pérez',
        shiftTypeId: '1',
        start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 0).toISOString(),
        end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0).toISOString(),
        role: 'Desarrollador Senior',
        notes: 'Proyecto urgente',
        backgroundColor: '#667eea',
        title: 'Juan Pérez - Turno Mañana',
        createdAt: new Date().toISOString()
      }
    ];

    setShiftTypes(defaultShiftTypes);
    setEmployees(defaultEmployees);
    setDepartments(defaultDepartments);
    setShifts(defaultShifts);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 300);

    return () => clearTimeout(timer);
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleItemClick = (itemId) => {
    setActiveItem(itemId);
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSaveShiftType = (shiftType) => {
    setShiftTypes(prev => [...prev, shiftType]);
    showNotification('success', 'Tipo de turno creado exitosamente');
  };

  const handleUpdateShiftType = (updatedType) => {
    setShiftTypes(prev => prev.map(type => type.id === updatedType.id ? updatedType : type));
    showNotification('success', 'Tipo de turno actualizado exitosamente');
  };

  const handleDeleteShiftType = (typeId) => {
    const shiftsUsingType = shifts.filter(s => s.shiftTypeId === typeId);
    if (shiftsUsingType.length > 0) {
      showNotification('error', `No se puede eliminar. Hay ${shiftsUsingType.length} turno(s) usando este tipo.`);
      return;
    }
    setShiftTypes(prev => prev.filter(type => type.id !== typeId));
    showNotification('success', 'Tipo de turno eliminado exitosamente');
  };

  const handleSaveShift = (shiftData) => {
    console.log('Guardando turno:', shiftData);
    
    if (editingShift) {
      setShifts(prev => prev.map(shift => {
        if (shift.id === shiftData.id) {
          console.log('Actualizando turno existente:', shiftData);
          return shiftData;
        }
        return shift;
      }));
      showNotification('success', 'Turno actualizado exitosamente');
    } else {
      setShifts(prev => {
        const newShifts = [...prev, shiftData];
        console.log('Nuevo turno agregado. Total de turnos:', newShifts.length);
        return newShifts;
      });
      showNotification('success', 'Turno creado exitosamente');
    }
    setIsShiftModalOpen(false);
    setEditingShift(null);
  };

  const handleEventClick = (event) => {
    const shift = shifts.find(s => s.id === event.id);
    if (shift) {
      setEditingShift(shift);
      setIsShiftModalOpen(true);
    }
  };

  const handleDeleteShift = (shiftId) => {
    setShifts(prev => prev.filter(shift => shift.id !== shiftId));
    setDeleteConfirm(null);
    showNotification('success', 'Horario eliminado');
  };

  const handleRequestDelete = (shift) => {
    setDeleteConfirm(shift);
  };

  const handleDuplicateShifts = (duplicatedShifts, conflicts) => {
    if (duplicatedShifts.length === 0 && conflicts.length > 0) {
      showNotification('error', 'No se pudo duplicar ningún turno debido a conflictos');
      return;
    }

    setShifts(prev => [...prev, ...duplicatedShifts]);
    
    if (conflicts.length > 0) {
      showNotification(
        'warning', 
        `Duplicación completada con advertencias: ${duplicatedShifts.length} turno(s) creado(s), ${conflicts.length} con conflictos omitido(s)`
      );
    } else {
      showNotification('success', `Duplicación completada: ${duplicatedShifts.length} turno(s) creado(s)`);
    }

    setIsDuplicateModalOpen(false);
  };

  // Función para detectar el tipo de turno según la hora
  const detectShiftTypeByTime = (startTime, endTime) => {
    const startTotalMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    let endTotalMinutes = endTime.getHours() * 60 + endTime.getMinutes();

    if (endTotalMinutes < startTotalMinutes) {
      endTotalMinutes += 1440;
    }

    let bestMatch = null;
    let bestScore = -1;

    shiftTypes.forEach(type => {
      let typeStartTotalMinutes = timeStringToMinutes(type.startTime);
      let typeEndTotalMinutes = timeStringToMinutes(type.endTime);

      if (typeEndTotalMinutes < typeStartTotalMinutes) {
        typeEndTotalMinutes += 1440;
      }

      let score = 0;

      if (startTotalMinutes === typeStartTotalMinutes && endTotalMinutes === typeEndTotalMinutes) {
        score = 100;
      }
      else if (Math.abs(startTotalMinutes - typeStartTotalMinutes) <= 30 && 
               Math.abs(endTotalMinutes - typeEndTotalMinutes) <= 30) {
        score = 80;
      }
      else if (startTotalMinutes >= typeStartTotalMinutes && endTotalMinutes <= typeEndTotalMinutes) {
        score = 60;
      }
      else if (startTotalMinutes < typeEndTotalMinutes && endTotalMinutes > typeStartTotalMinutes) {
        score = 40;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = type;
      }
    });

    return bestMatch?.id || shiftTypes[0]?.id;
  };

  const handleEventDrop = (info) => {
    const newStart = new Date(info.event.start);
    const newEnd = new Date(info.event.end);
  
    console.log('Evento movido - Inicio:', newStart.toLocaleString(), 'Fin:', newEnd.toLocaleString());

    // Validar que no sea antes de las 6 AM
    const startHour = newStart.getHours();
  
    if (startHour < 6 && startHour >= 0) {
      info.revert();
      showNotification('error', 'Los turnos no pueden comenzar antes de las 06:00 AM');
      return;
    }

    // Detectar automáticamente el tipo de turno según el horario completo
    const newShiftTypeId = detectShiftTypeByTime(newStart, newEnd);
    const newShiftType = shiftTypes.find(t => t.id === newShiftTypeId);

    console.log('Nuevo tipo detectado:', newShiftType?.name);

    // Buscar el turno original
    const originalShift = shifts.find(s => s.id === info.event.id);
    if (!originalShift) {
      console.error('Turno original no encontrado');
      info.revert();
      return;
    }

    const updatedShift = {
      ...originalShift,
      start: newStart.toISOString(),
      end: newEnd.toISOString(),
      shiftTypeId: newShiftTypeId,
      backgroundColor: newShiftType?.color || originalShift.backgroundColor,
      title: `${originalShift.employeeName} - ${newShiftType?.name || 'Turno'}`
    };

    console.log('Turno actualizado:', updatedShift);

    setShifts(prev => prev.map(shift => shift.id === updatedShift.id ? updatedShift : shift));
    showNotification('success', `Turno movido a ${newShiftType?.name || 'nuevo horario'}`);
  };

  const currentPageTitle = menuItems.find((item) => item.id === activeItem)?.label || "Calendario";

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
          {activeItem === "calendario" && (
            <div className="calendar-page-container">
              {notification && (
                <div className={`calendar-notification calendar-notification-${notification.type}`}>
                  <div className="calendar-notification-content">
                    {notification.type === 'success' && <FaCheck className="calendar-notification-icon" />}
                    {notification.type === 'error' && <FaTimes className="calendar-notification-icon" />}
                    {notification.type === 'warning' && <FaExclamationTriangle className="calendar-notification-icon" />}
                    <span>{notification.message}</span>
                  </div>
                </div>
              )}

              <div className="calendar-actions-bar">
                <button className="calendar-btn-action calendar-btn-primary" onClick={() => setIsShiftModalOpen(true)} aria-label="Crear turno">
                  <FaPlus className="calendar-icon" aria-hidden="true" /> <span>Crear Turno</span>
                </button>
                <button className="calendar-btn-action calendar-btn-secondary" onClick={() => setIsDuplicateModalOpen(true)} aria-label="Duplicar horarios">
                  <FaCopy className="calendar-icon" aria-hidden="true" /> <span>Duplicar Horarios</span>
                </button>
                <button className="calendar-btn-action calendar-btn-secondary" onClick={() => setIsTypeManagerOpen(!isTypeManagerOpen)} aria-label="Gestionar tipos de turno">
                  <FaClock className="calendar-icon" aria-hidden="true" /> <span>{isTypeManagerOpen ? 'Ocultar' : 'Gestionar'} Tipos de Turno</span>
                </button>
              </div>

              {isTypeManagerOpen && (
                <div className="calendar-type-manager-section">
                  <ShiftTypeManager
                    shiftTypes={shiftTypes}
                    onSave={handleSaveShiftType}
                    onUpdate={handleUpdateShiftType}
                    onDelete={handleDeleteShiftType}
                  />
                </div>
              )}

              <div className="calendar-full-width">
                <CalendarView
                  events={shifts}
                  onEventClick={handleEventClick}
                  onEventDrop={handleEventDrop}
                  onRequestDelete={handleRequestDelete}
                />
              </div>

              <ShiftModal
                isOpen={isShiftModalOpen}
                onClose={() => { setIsShiftModalOpen(false); setEditingShift(null); }}
                onSave={handleSaveShift}
                onDelete={handleDeleteShift}
                shift={editingShift}
                employees={employees}
                shiftTypes={shiftTypes}
                existingShifts={shifts}
                unavailabilities={unavailabilities}
              />

              <ShiftDuplicateModal
                isOpen={isDuplicateModalOpen}
                onClose={() => setIsDuplicateModalOpen(false)}
                onDuplicate={handleDuplicateShifts}
                shifts={shifts}
                employees={employees}
                unavailabilities={unavailabilities}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;