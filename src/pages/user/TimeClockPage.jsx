import React, { useState, useEffect, useRef, useCallback } from 'react';
import TimeEntryCard from '../../components/time/user/TimeEntryCard';
import TimeExitCard from '../../components/time/user/TimeExitCard';
import TimeNotification from '../../components/time/user/TimeNotification';
import TimeHistory from '../../components/time/user/TimeHistory';
import TimeSummary from '../../components/time/user/TimeSummary';
import SidebarEmployee from '../../components/common/SidebarEmployee';
import Header from '../../components/common/Header';
import timeEntryService from '../../services/timeEntryService';
import shiftService from '../../services/shiftService';
import { formatTime } from '../../utils/dateUtils';
import '../../styles/pages/user/TimeClockPage.css';

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// NOTE: time formatting is handled by `formatTime` from utils/dateUtils

const TimeClockPage = () => {
  const [notification, setNotification] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState("registrar-horas");
  const [loading, setLoading] = useState(true);

  const historyRef = useRef(null);
  
  const [shiftData, setShiftData] = useState({
    hasActiveShift: false,
    entryRegistered: false,
    exitRegistered: false,
    shiftStart: '--:--',
    shiftEnd: '--:--',
    shiftTypeName: 'Sin turno',
    currentShift: null,
    todayEntries: {
      check_in: null,
      check_out: null
    }
  });

  // ✅ Cargar datos iniciales (la llamada se realiza después de definir la función)

  // TimeClockPage.jsx - ACTUALIZAR loadInitialData

const loadInitialData = useCallback(async (silent = false) => {
  try {
    if (!silent) setLoading(true);
    
    
    // ✅ Fecha actual en hora local Colombia
    const today = new Date();
    const todayStr = getLocalDateString(today);
    

    // 1. Obtener SOLO turnos de HOY
    const shiftsData = await shiftService.getMyShifts({
      start_date: todayStr,
      end_date: todayStr
    });


    // 2. Obtener registros de hoy
    const todayEntries = await timeEntryService.getTodayEntries();

    // ✅ Verificar registros
    const hasCheckIn = !!todayEntries.check_in;
    const hasCheckOut = !!todayEntries.check_out;
    const bothRegistered = hasCheckIn && hasCheckOut;


    // Dejar timestamps crudos en todayEntries; el formateo se hace en los componentes

    // ✅ DETERMINAR SI HAY TURNOS PARA HOY - LÓGICA CRÍTICA
    const hasShiftsForToday = shiftsData && shiftsData.length > 0;
    let activeShift = null;

    if (hasShiftsForToday) {
      const currentTime = today.toTimeString().slice(0, 5);
      
      // Buscar turno activo
      activeShift = shiftsData.find(shift => {
        const shiftStart = shift.start_time || '';
        const shiftEnd = shift.end_time || '';
        
        if (shiftEnd < shiftStart) {
          return currentTime >= shiftStart || currentTime <= shiftEnd;
        }
        return currentTime >= shiftStart && currentTime <= shiftEnd;
      });

      // Si no hay activo, buscar próximo
      if (!activeShift) {
        activeShift = shiftsData.find(shift => currentTime < (shift.start_time || '')) || shiftsData[0];
      }
    }


    // ✅ ESTADO FINAL - LIMPIAR CUANDO NO HAY TURNOS
    const finalState = {
      // ✅ SI NO HAY TURNOS PARA HOY -> NO HAY TURNO ACTIVO
      hasActiveShift: hasShiftsForToday ? !bothRegistered && !!activeShift : false,
      
      entryRegistered: hasCheckIn,
      exitRegistered: hasCheckOut,
      
      // ✅ SI NO HAY TURNOS -> LIMPIAR HORARIOS
      shiftStart: hasShiftsForToday ? (activeShift?.start_time || '--:--') : '--:--',
      shiftEnd: hasShiftsForToday ? (activeShift?.end_time || '--:--') : '--:--',
      
      // ✅ SI NO HAY TURNOS -> "Sin turno"
      shiftTypeName: hasShiftsForToday ? (activeShift?.shift_type_name || 'Jornada completa') : 'Sin turno',
      
      currentShift: hasShiftsForToday ? activeShift : null,
      todayEntries: todayEntries,
      
      // ✅ FECHA ACTUAL PARA EL SUMMARY
      currentDate: todayStr,
      
      // ✅ NUEVO: INDICAR EXPLÍCITAMENTE SI HAY TURNOS
      hasShiftsForToday: hasShiftsForToday
    };

    setShiftData(finalState);

  } catch (error) {
    console.error('❌ Error cargando datos:', error);
    if (!silent) showNotification('error', 'Error al cargar datos del turno');
  } finally {
    setLoading(false);
  }
}, []);

  // Llamar al inicializador después de su definición
  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEntryRegister = async () => {
    try {

      if (!shiftData.hasActiveShift) {
        showNotification('error', 'No tienes un turno activo para hoy');
        return;
      }

      if (shiftData.entryRegistered) {
        showNotification('error', 'Ya registraste tu entrada');
        return;
      }

      // Registrar entrada
      const entry = await timeEntryService.createTimeEntry(
        'check_in',
        'Entrada registrada desde el sistema',
        '',
        shiftData.currentShift?.id
      );


      // ✅ Convertir timestamp a formato 12h (AM/PM)
      entry.time_local = formatTime(entry.timestamp || entry.time);

      // Actualizar estado
      setShiftData(prev => ({
        ...prev,
        entryRegistered: true,
        todayEntries: {
          ...prev.todayEntries,
          check_in: entry
        }
      }));

      showNotification('success', `✓ Entrada registrada a las ${entry.time_local}`);

      // ✅ Actualizar historial automáticamente
      if (historyRef.current?.refreshHistory) {
        historyRef.current.refreshHistory();
      }

    } catch (error) {
      console.error('❌ Error registrando entrada:', error);
      showNotification('error', error.message || 'Error al registrar entrada');
    }
  };

  const handleExitRegister = async () => {
    try {

      if (!shiftData.entryRegistered) {
        showNotification('error', 'Debes registrar tu entrada primero');
        return;
      }

      if (shiftData.exitRegistered) {
        showNotification('error', 'Ya registraste tu salida');
        return;
      }

      // Registrar salida
      const exit = await timeEntryService.createTimeEntry(
        'check_out',
        'Salida registrada desde el sistema',
        '',
        shiftData.currentShift?.id
      );


      // ✅ Convertir timestamp a formato 12h (AM/PM)
      exit.time_local = formatTime(exit.timestamp || exit.time);

      // Actualizar estado
      setShiftData(prev => ({
        ...prev,
        exitRegistered: true,
        todayEntries: {
          ...prev.todayEntries,
          check_out: exit
        }
      }));

      showNotification('success', `✓ Salida registrada a las ${exit.time_local}`);

      // ✅ Actualizar historial automáticamente
      if (historyRef.current?.refreshHistory) {
        historyRef.current.refreshHistory();
      }

    } catch (error) {
      console.error('❌ Error registrando salida:', error);
      showNotification('error', error.message || 'Error al registrar salida');
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const handleItemClick = (itemId) => setActiveItem(itemId);

  if (loading) {
    return (
      <div className="time-page-container">
        <SidebarEmployee 
          isOpen={sidebarOpen} 
          onToggle={toggleSidebar} 
          activeItem={activeItem} 
          onItemClick={handleItemClick}
          darkMode={false}
        />
        <div className={`time-main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
          <Header onToggleSidebar={toggleSidebar} pageTitle="Registro de Horas" />
          <div className="time-content-area">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Cargando datos...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="time-page-container">
      <SidebarEmployee 
        isOpen={sidebarOpen} 
        onToggle={toggleSidebar} 
        activeItem={activeItem} 
        onItemClick={handleItemClick}
        darkMode={false}
      />

      <div className={`time-main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <Header onToggleSidebar={toggleSidebar} pageTitle="Registro de Horas" />
    
        <div className="time-content-area">
          {/* Summary Cards */}
          <TimeSummary shiftData={shiftData} />

          {/* Entry and Exit Cards */}
          <div className="time-grid-layout">
            <TimeEntryCard 
              onRegister={handleEntryRegister}
              isDisabled={!shiftData.hasActiveShift || shiftData.entryRegistered}
              shiftData={shiftData}
            />
            <TimeExitCard 
              onRegister={handleExitRegister}
              isDisabled={!shiftData.entryRegistered || shiftData.exitRegistered}
              shiftData={shiftData}
            />
          </div>

          {/* History Section */}
          <TimeHistory ref={historyRef} />
        </div>

        {/* Notification */}
        {notification && (
          <TimeNotification 
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
      </div>
    </div>
  );
};

export default TimeClockPage;
