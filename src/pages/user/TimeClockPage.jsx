import React, { useState, useEffect, useRef } from 'react';
import TimeEntryCard from '../../components/time/user/TimeEntryCard';
import TimeExitCard from '../../components/time/user/TimeExitCard';
import TimeNotification from '../../components/time/user/TimeNotification';
import TimeHistory from '../../components/time/user/TimeHistory';
import TimeSummary from '../../components/time/user/TimeSummary';
import SidebarEmployee from '../../components/common/SidebarEmployee';
import Header from '../../components/common/Header';
import timeEntryService from '../../services/timeEntryService';
import shiftService from '../../services/shiftService';
import '../../styles/pages/user/TimeClockPage.css';

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTimestampToLocal = (timestamp) => {
  if (!timestamp) return '--:--:--';
  
  try {
    const date = new Date(timestamp);
    
    // Verificar que la fecha sea válida
    if (isNaN(date.getTime())) {
      return '--:--:--';
    }
    
    // Formatear en hora local
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error formateando timestamp:', error);
    return '--:--:--';
  }
};

const formatTimestampToLocalShort = (timestamp) => {
  if (!timestamp) return '--:--';
  
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '--:--';
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes}`;
  } catch (error) {
    return '--:--';
  }
};

const TimeClockPage = () => {
  const [notification, setNotification] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
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

  // ✅ Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  // ✅ Actualizar reloj cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // TimeClockPage.jsx - ACTUALIZAR loadInitialData

const loadInitialData = async (silent = false) => {
  try {
    if (!silent) setLoading(true);
    
    console.log('🔄 [TimeClockPage] Cargando datos iniciales...');
    
    // ✅ Usar fecha local en lugar de UTC
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const todayStr = getLocalDateString(today);
    const yesterdayStr = getLocalDateString(yesterday);
    const tomorrowStr = getLocalDateString(tomorrow);
    
    console.log('📅 [DEBUG] Fechas locales (Colombia):');
    console.log('  Ayer:', yesterdayStr);
    console.log('  Hoy:', todayStr);
    console.log('  Mañana:', tomorrowStr);

    // 1. Obtener turnos en rango amplio
    const shiftsData = await shiftService.getMyShifts({
      start_date: yesterdayStr,
      end_date: tomorrowStr
    });

    console.log('📊 Turnos encontrados:', shiftsData);

    // 2. Obtener registros de hoy
    const todayEntries = await timeEntryService.getTodayEntries();
    console.log('📝 Registros de hoy (raw):', todayEntries);

    // ✅ Verificar si hay entrada Y salida registradas
    const hasCheckIn = !!todayEntries.check_in;
    const hasCheckOut = !!todayEntries.check_out;
    const bothRegistered = hasCheckIn && hasCheckOut;

    console.log('✅ Estado de registros:', {
      hasCheckIn,
      hasCheckOut,
      bothRegistered
    });

    // ✅ Convertir timestamps a hora local
    if (todayEntries.check_in) {
      todayEntries.check_in.time_local = formatTimestampToLocalShort(todayEntries.check_in.timestamp);
      console.log('✅ Entrada:', todayEntries.check_in.time_local);
    }
    
    if (todayEntries.check_out) {
      todayEntries.check_out.time_local = formatTimestampToLocalShort(todayEntries.check_out.timestamp);
      console.log('✅ Salida:', todayEntries.check_out.time_local);
    }

    // 3. Determinar turno activo
    let activeShift = null;
    if (shiftsData && shiftsData.length > 0) {
      const currentTime = today.toTimeString().slice(0, 5);
      const todayShifts = shiftsData.filter(shift => shift.date === todayStr);
      
      console.log('📋 Turnos de HOY:', todayShifts);

      // Buscar turno activo AHORA
      activeShift = todayShifts.find(shift => {
        const shiftStart = shift.start_time || '';
        const shiftEnd = shift.end_time || '';
        
        if (shiftEnd < shiftStart) {
          return currentTime >= shiftStart || currentTime <= shiftEnd;
        }
        return currentTime >= shiftStart && currentTime <= shiftEnd;
      });

      // Si no hay activo, buscar el próximo
      if (!activeShift) {
        const upcomingShift = todayShifts.find(shift => {
          return currentTime < (shift.start_time || '');
        });
        activeShift = upcomingShift || todayShifts[0];
      }
    }

    console.log('🎯 Turno seleccionado:', activeShift);

    // ✅ CRÍTICO: Si ya hay entrada Y salida, NO hay turno activo
    const hasActiveTurn = bothRegistered ? false : !!activeShift;

    setShiftData({
      hasActiveShift: hasActiveTurn,  // ✅ False si ya completó el día
      entryRegistered: hasCheckIn,
      exitRegistered: hasCheckOut,
      shiftStart: activeShift?.start_time || '--:--',
      shiftEnd: activeShift?.end_time || '--:--',
      shiftTypeName: activeShift?.shift_type_name || (bothRegistered ? 'Jornada completa' : 'Sin turno'),
      currentShift: activeShift,
      todayEntries: todayEntries
    });

  } catch (error) {
    console.error('❌ Error cargando datos:', error);
    if (!silent) showNotification('error', 'Error al cargar datos del turno');
  } finally {
    setLoading(false);
  }
};

  const handleEntryRegister = async () => {
    try {
      console.log('📝 [TimeClockPage] Registrando entrada...');

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

      console.log('✅ Entrada registrada (raw):', entry);

      // ✅ Convertir timestamp a hora local
      entry.time_local = formatTimestampToLocalShort(entry.timestamp);
      console.log('✅ Hora local de entrada:', entry.time_local);

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
        console.log('🔄 Actualizando historial...');
        historyRef.current.refreshHistory();
      }

    } catch (error) {
      console.error('❌ Error registrando entrada:', error);
      showNotification('error', error.message || 'Error al registrar entrada');
    }
  };

  const handleExitRegister = async () => {
    try {
      console.log('📝 [TimeClockPage] Registrando salida...');

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

      console.log('✅ Salida registrada (raw):', exit);

      // ✅ Convertir timestamp a hora local
      exit.time_local = formatTimestampToLocalShort(exit.timestamp);
      console.log('✅ Hora local de salida:', exit.time_local);

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
        console.log('🔄 Actualizando historial...');
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