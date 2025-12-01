import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaPlus, FaCopy, FaClock, FaCheck, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import CalendarView from '../../components/calendar/admin/CalendarView';
import ShiftTypeManager from '../../components/calendar/admin/ShiftTypeManager';
import ShiftModal from '../../components/calendar/admin/ShiftModal';
import ShiftDuplicateModal from '../../components/calendar/admin/ShiftDuplicateModal';
// timeStringToMinutes removed (not needed here)
import { userService } from '../../services/userService';
import { shiftService } from '../../services/shiftService'; 
import availabilityService from '../../services/availabilityService';
import '/src/styles/pages/admin/DashboardPage.css';
import '../../styles/pages/admin/CalendarPage.css';

const CalendarPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeItem, setActiveItem] = useState("calendario");
  const [shifts, setShifts] = useState([]);
  const [shiftTypes, setShiftTypes] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [unavailabilities, _setUnavailabilities] = useState([]);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isTypeManagerOpen, setIsTypeManagerOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Si venimos navegando con state para prefill (desde TimeScheduleDetails), abrir modal
  useEffect(() => {
    if (loading) return; // esperar a que los datos iniciales carguen
    try {
      const state = location?.state || {};
      if (state.openShiftModal) {
        const s = state.prefillShift || {};

        const editing = {
          id: s.id || null,
          employeeId: s.employeeId || s.employee || '',
          employeeName: s.employeeName || '',
          shiftTypeId: s.shiftTypeId || null,
          shiftTypeName: s.shiftTypeName || '',
          start: s.start || (s.date && s.start_time ? `${s.date}T${s.start_time}` : null),
          end: s.end || (s.date && s.end_time ? `${s.date}T${s.end_time}` : null),
          date: s.date || (s.start ? String(s.start).split('T')[0] : ''),
          start_time: s.start_time || (s.start ? String(s.start).split('T')[1]?.slice(0,5) : ''),
          end_time: s.end_time || (s.end ? String(s.end).split('T')[1]?.slice(0,5) : ''),
          role: s.role || '',
          notes: s.notes || '',
          backgroundColor: s.backgroundColor || '#667eea'
        };

        setEditingShift(editing);
        setIsShiftModalOpen(true);

        // limpiar el state de la ubicación para evitar re-trigger
        try {
          navigate(location.pathname, { replace: true, state: {} });
        } catch {
          // noop
        }
      }
    } catch (err) {
      console.error('Error handling prefill state for calendar:', err);
    }
  }, [loading, location, navigate]);

  const menuItems = [
    { id: "dashboard", label: "Inicio", icon: "dashboard" },
    { id: "calendario", label: "Calendario", icon: "calendar" },
    { id: "disponibilidad", label: "Disponibilidad", icon: "availability" },
    { id: "solicitudes", label: "Solicitudes", icon: "requests" },
    { id: "equipo", label: "Equipo", icon: "team" },
    { id: "informes", label: "Informes", icon: "reports" },
  ];

  // Cargar datos iniciales desde el backend
  useEffect(() => {
    initializeData();
  }, []);

  // Normalizar un tipo de turno desde el backend al formato frontend
  const normalizeShiftType = (t) => {
    if (!t) return t;
    const startRaw = t.start_time ?? t.startTime ?? t.start ?? '';
    const endRaw = t.end_time ?? t.endTime ?? t.end ?? '';
    const normalizeTime = (s) => {
      if (!s) return '';
      // aceptar HH:MM:SS o HH:MM o incluso 'T' timestamps
      if (/^\d{2}:\d{2}:\d{2}$/.test(s)) return s.slice(0,5);
      if (/^\d{2}:\d{2}$/.test(s)) return s;
      const m = String(s).match(/(\d{2}:\d{2})/);
      return m ? m[1] : '';
    };

    return {
      id: t.id ?? t.pk ?? t.uuid ?? null,
      name: t.name ?? t.title ?? '',
      startTime: normalizeTime(startRaw),
      endTime: normalizeTime(endRaw),
      color: t.color ?? t.color_hex ?? t.colorHex ?? '#667eea',
      createdAt: t.created_at ?? t.createdAt ?? null,
      // mantener resto por si acaso
      __raw: t
    };
  };

const initializeData = async () => {
  try {
    setLoading(true);
    console.log('🔄 Inicializando datos del calendario...');
    
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    // ==========================================
    // 1️⃣ CARGAR TIPOS DE TURNO
    // ==========================================
    let shiftTypesData = [];
    try {
      shiftTypesData = await shiftService.getShiftTypes();
      console.log('✅ Tipos de turno recibidos:', shiftTypesData?.length);
      
      // Normalizar tipos de turno
      const normalizedTypes = (
        Array.isArray(shiftTypesData) 
          ? shiftTypesData 
          : (shiftTypesData.results || shiftTypesData.data || [])
      ).map(normalizeShiftType);
      
      console.log('✅ Tipos de turno normalizados:', normalizedTypes.length);
      setShiftTypes(normalizedTypes);
    } catch (err) {
      console.error('❌ Error cargando tipos de turno:', err);
      showNotification('error', 'Error al cargar tipos de turno');
    }

    // ==========================================
    // 2️⃣ CARGAR TURNOS
    // ==========================================
    try {
      const shiftsData = await shiftService.getShiftsForCalendar();
      console.log('✅ Turnos cargados desde backend:', shiftsData?.length);
      
      // Verificar muestra del primer turno
      if (shiftsData && shiftsData.length > 0) {
        console.log('📊 Muestra de turno raw del backend:', shiftsData[0]);
      }

      // ✅ Formatear turnos para FullCalendar con TODOS los campos
      const formattedShifts = (shiftsData || []).map(shift => {
        // Extraer datos del turno
        const shiftId = shift.id || shift.pk;
        const employeeId = shift.employeeId || shift.employee_id || shift.employee;
        const employeeName = shift.employeeName || shift.employee_name || shift.title?.split(' - ')[0] || 'Sin nombre';
        const shiftTypeId = shift.shiftTypeId || shift.shift_type_id || shift.shift_type;
        const shiftTypeName = shift.shiftTypeName || shift.shift_type_name || '';
        
        // ✅ CRÍTICO: Extraer notes correctamente
        const notes = shift.notes || shift.note || '';
        const role = shift.role || '';
        
        const color = shift.backgroundColor || shift.color || shift.color_hex || '#667eea';
        
        // Fechas/horas
        const startDateTime = shift.start || shift.start_datetime;
        const endDateTime = shift.end || shift.end_datetime;

        const isLocked = shift.is_locked || shift.isLocked || false;
        const lockReason = shift.lock_reason || shift.lockReason || '';
        const lockedAt = shift.locked_at || shift.lockedAt || null;

        console.log(`📝 Turno ${shiftId} - Notes:`, notes); // ✅ Log individual

        return {
          id: shiftId,
          title: shift.title || `${employeeName}${shiftTypeName ? ' - ' + shiftTypeName : ''}`,
          start: startDateTime,
          end: endDateTime,
          backgroundColor: color,
          borderColor: color,

          is_locked: isLocked,
          isLocked: isLocked,
          lock_reason: lockReason,
          lockReason: lockReason,
          locked_at: lockedAt,
          lockedAt: lockedAt,
          
          // ✅ CRÍTICO: Guardar TODOS los datos en extendedProps
          extendedProps: {
            employeeId: employeeId,
            employeeName: employeeName,
            shiftTypeId: shiftTypeId,
            shiftTypeName: shiftTypeName,
            role: role,
            notes: notes,
            is_locked: isLocked,
            isLocked: isLocked,
            lock_reason: lockReason,
            lockReason: lockReason,
            locked_at: lockedAt,
            lockedAt: lockedAt,  
          }
        };
      });

      console.log('✅ Turnos formateados para calendario:', formattedShifts.length);
      if (formattedShifts.length > 0) {
        console.log('📊 Muestra de turno formateado:', formattedShifts[0]);
        console.log('📝 ExtendedProps del primer turno:', formattedShifts[0].extendedProps);
      }
      
      setShifts(formattedShifts);
    } catch (err) {
      console.error('❌ Error cargando turnos:', err);
      showNotification('warning', 'No se pudieron cargar los turnos');
      setShifts([]);
    }

    // ==========================================
    // 3️⃣ CARGAR EMPLEADOS
    // ==========================================
    console.log('👥 Cargando empleados...');
    let employeesData = [];
    
    // Intento 1: shiftService.getEmployees()
    try {
      employeesData = await shiftService.getEmployees();
      console.log('✅ Empleados cargados con shiftService.getEmployees():', employeesData?.length);
    } catch (err) {
      console.warn('⚠️ shiftService.getEmployees() falló:', err.message);
      employeesData = [];
    }

    // Intento 2: userService.getUsers() (fallback)
    if (!employeesData || employeesData.length === 0) {
      try {
        console.log('👥 Intentando fallback con userService.getUsers()...');
        const users = await userService.getUsers();
        console.log('✅ Usuarios cargados con userService:', users?.length || 0);
        employeesData = Array.isArray(users) ? users : (users.results || users.data || []);
      } catch (err) {
        console.error('❌ Error al cargar empleados con userService (fallback):', err);
        employeesData = [];
      }
    }

    // Normalizar empleados (por si viene en formato paginado)
    if (!Array.isArray(employeesData)) {
      if (employeesData && employeesData.results && Array.isArray(employeesData.results)) {
        employeesData = employeesData.results;
      } else if (employeesData && employeesData.data && Array.isArray(employeesData.data)) {
        employeesData = employeesData.data;
      } else {
        // Buscar primer array en el objeto
        const firstArray = employeesData ? Object.values(employeesData).find(v => Array.isArray(v)) : null;
        employeesData = firstArray || [];
      }
    }

    // ✅ Normalizar estructura de empleados para consistencia
    const normalizedEmployees = employeesData.map(emp => ({
      id: emp.id || emp.pk || emp.user_id,
      employee_id: emp.employee_id,  // ✅ CRÍTICO: Mantener employee_id para mapeo con disponibilidades
      name: emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || 'Sin nombre',
      position: emp.position || emp.puesto || emp.jobTitle || emp.role || 'Sin puesto',
      email: emp.email || '',
      // Mantener datos originales por compatibilidad
      ...emp
    }));

    console.log('👥 Empleados normalizados (final):', normalizedEmployees.length);
    
    if (normalizedEmployees.length > 0) {
      console.log('📊 Muestra de empleado:', normalizedEmployees[0]);
      setEmployees(normalizedEmployees);
    } else {
      console.warn('⚠️ No se encontraron empleados');
      showNotification('warning', 'No se encontraron empleados en el sistema');
      setEmployees([]);
    }

    // ==========================================
    // 4️⃣ CARGAR DISPONIBILIDADES
    // ==========================================
    console.log('📅 Cargando disponibilidades...');
    let unavailabilitiesData = [];

    try {
      // ✅ Usar availabilityService
      unavailabilitiesData = await availabilityService.getAvailabilities();
      console.log('✅ Disponibilidades cargadas desde API:', unavailabilitiesData);
      
      // Normalizar disponibilidades
      const normalizedAvailabilities = (
        Array.isArray(unavailabilitiesData) 
          ? unavailabilitiesData 
          : (unavailabilitiesData.results || unavailabilitiesData.data || [])
      ).map(avail => {
        console.log('🔍 Procesando disponibilidad:', {
          id: avail.id,
          employee_id: avail.employee_id,
          date: avail.date,
          type: avail.type,
          start_time: avail.start_time,
          end_time: avail.end_time
        });
        
        return {
          id: avail.id,
          employee_id: avail.employee_id,
          employee_user_id: avail.employee_user_id,
          date: avail.date,
          start_time: avail.start_time,
          end_time: avail.end_time,
          type: avail.type,
          notes: avail.notes || '',
          // Mantener datos originales
          ...avail
        };
      });
      
      console.log('✅ Disponibilidades normalizadas:', normalizedAvailabilities.length);
      
      if (normalizedAvailabilities.length > 0) {
        console.log('📊 Primera disponibilidad normalizada:', normalizedAvailabilities[0]);
        
        // ✅ Verificar mapeo de IDs
        const firstAvail = normalizedAvailabilities[0];
        const matchingEmployee = normalizedEmployees.find(emp => 
          emp.employee_id === firstAvail.employee_id ||
          emp.id === firstAvail.employee_id
        );
        
        if (matchingEmployee) {
          console.log('✅ Mapeo correcto - Empleado encontrado:', {
            avail_employee_id: firstAvail.employee_id,
            employee_user_id: matchingEmployee.id,
            employee_db_id: matchingEmployee.employee_id,
            employee_name: matchingEmployee.name
          });
        } else {
          console.warn('⚠️ No se encontró empleado para disponibilidad:', {
            avail_employee_id: firstAvail.employee_id,
            empleados_disponibles: normalizedEmployees.map(e => ({
              id: e.id,
              employee_id: e.employee_id,
              name: e.name
            }))
          });
        }
      }
      
      _setUnavailabilities(normalizedAvailabilities);
      
    } catch (err) {
      console.error('❌ Error cargando disponibilidades:', err);
      console.error('❌ Error completo:', err.response?.data || err.message);
      _setUnavailabilities([]);
    }

  } catch (error) {
    console.error('❌ Error inicializando datos:', error);
    
    let errorMessage = 'Error al cargar los datos del calendario';
    
    if (error.message.includes('token') || error.message.includes('autenticación')) {
      errorMessage = 'Error de autenticación. Por favor, inicia sesión nuevamente.';
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } else if (error.message.includes('empleados')) {
      errorMessage = 'Error al cargar la lista de empleados. Verifica los permisos.';
    } else if (error.message.includes('turnos')) {
      errorMessage = 'Error al cargar los turnos. Verifica la conexión.';
    }
    
    showNotification('error', errorMessage);
    
    // Establecer estados vacíos en caso de error crítico
    setShiftTypes([]);
    setShifts([]);
    setEmployees([]);
    _setUnavailabilities([]);
  } finally {
    setLoading(false);
  }
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

  // Manejo de Tipos de Turno
  const handleSaveShiftType = async (shiftType) => {
  try {
    // Verificar autenticación antes de proceder
    const token = localStorage.getItem('token');
    if (!token) {
      showNotification('error', 'Debes iniciar sesión para realizar esta acción');
      return;
    }

    console.log('🔐 Token antes de crear tipo de turno:', token);
    console.log('📝 Datos del tipo de turno (original):', shiftType);

    // Mapear explícitamente el objeto al payload que espera el backend
    const padSeconds = (t) => {
      if (!t) return undefined;
      if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
      if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
      const m = String(t).match(/(\d{2}:\d{2})/);
      if (m) return `${m[1]}:00`;
      return undefined;
    };

    const payload = {
      name: shiftType.name,
      start_time: padSeconds(shiftType.startTime || shiftType.start_time),
      end_time: padSeconds(shiftType.endTime || shiftType.end_time),
      color: shiftType.color
    };

    console.log('🟢 Payload enviado al backend (mappeado):', payload);

  const newType = await shiftService.createShiftType(payload);
  // Normalizar antes de agregar al estado
  const normalized = normalizeShiftType(newType);
  setShiftTypes(prev => [...prev, normalized]);
    showNotification('success', 'Tipo de turno creado exitosamente');
  } catch (error) {
    console.error('Error creating shift type:', error);
    
    // Manejo específico de errores
    if (error.message.includes('No tienes permisos') || error.message.includes('403')) {
      showNotification('error', 'No tienes permisos para crear tipos de turno. Contacta al administrador.');
    } else if (error.message.includes('token') || error.message.includes('authentication')) {
      showNotification('error', 'Sesión expirada. Por favor, inicia sesión nuevamente.');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } else {
      showNotification('error', error.message || 'Error al crear el tipo de turno');
    }
  }
};

  const handleUpdateShiftType = async (updatedTypeOrId, maybeData) => {
    try {
      // Aceptar dos formas de llamada: (updatedTypeObject) o (id, data)
      let shiftTypeId;
      let payload;

      if (updatedTypeOrId && typeof updatedTypeOrId === 'object') {
        shiftTypeId = updatedTypeOrId.id ?? updatedTypeOrId.pk ?? null;
        payload = updatedTypeOrId;
      } else {
        shiftTypeId = updatedTypeOrId;
        payload = maybeData || {};
      }

      if (!shiftTypeId) {
        console.error('handleUpdateShiftType: no se proporcionó id del tipo de turno', { updatedTypeOrId, maybeData });
        showNotification('error', 'ID del tipo de turno no proporcionado');
        return;
      }

      const result = await shiftService.updateShiftType(shiftTypeId, payload);
      const normalized = normalizeShiftType(result);
      setShiftTypes(prev => prev.map(type => type.id === shiftTypeId ? normalized : type));
      showNotification('success', 'Tipo de turno actualizado exitosamente');
    } catch (error) {
      console.error('Error updating shift type:', error);
      showNotification('error', 'Error al actualizar el tipo de turno');
    }
  };

  const handleDeleteShiftType = async (typeId) => {
    try {
      // Verificar si hay turnos usando este tipo
      const shiftsUsingType = shifts.filter(s => s.extendedProps?.shiftTypeId === typeId);
      if (shiftsUsingType.length > 0) {
        showNotification('error', `No se puede eliminar. Hay ${shiftsUsingType.length} turno(s) usando este tipo.`);
        return;
      }
      
      await shiftService.deleteShiftType(typeId);
      setShiftTypes(prev => prev.filter(type => type.id !== typeId));
      showNotification('success', 'Tipo de turno eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting shift type:', error);
      showNotification('error', 'Error al eliminar el tipo de turno');
    }
  };

  // Manejo de Turnos
  const handleSaveShift = async (shiftData) => {
  try {
    console.log('💾 [CalendarPage] Guardando turno - Data recibida:', shiftData);
    
    // ✅ CORRECCIÓN: Usar shiftData.id directamente (viene de ShiftModal)
    const shiftId = shiftData.id;
    console.log('🔍 [CalendarPage] ID del turno a guardar:', shiftId);
    
    // ✅ CORRECCIÓN: Usar los nombres de campo correctos que espera el backend
    const backendPayload = {
      date: shiftData.date,
      start_time: shiftData.start_time,
      end_time: shiftData.end_time,
      employee: parseInt(shiftData.employee),  // ✅ Usar 'employee' (no employeeId)
      shift_type: parseInt(shiftData.shift_type),  // ✅ Usar 'shift_type' (no shiftTypeId)
      notes: shiftData.notes || '',
      role: shiftData.role || ''
    };

    console.log('📤 [CalendarPage] Payload para backend:', backendPayload);
    
    // ✅ CORRECCIÓN: Verificar explícitamente si hay ID para determinar si es edición
    if (shiftId) {
      console.log('🔄 [CalendarPage] Actualizando turno:', shiftId, backendPayload);
      
      await shiftService.updateShift(shiftId, backendPayload);
      
      // Actualizar en el estado local
      setShifts(prev => prev.map(shift => {
        if (shift.id === shiftId) {
          return {
            ...shift,
            title: `${shiftData.employeeName} - ${shiftData.shiftTypeName}`,
            start: `${shiftData.date}T${shiftData.start_time}`,
            end: `${shiftData.date}T${shiftData.end_time}`,
            backgroundColor: shiftData.backgroundColor,
            color: shiftData.backgroundColor,
            extendedProps: {
              ...shift.extendedProps,
              employeeId: shiftData.employee,
              employeeName: shiftData.employeeName,
              shiftTypeId: shiftData.shift_type,
              shiftTypeName: shiftData.shiftTypeName,
              role: shiftData.role,
              notes: shiftData.notes
            }
          };
        }
        return shift;
      }));
      
      showNotification('success', 'Turno actualizado exitosamente');
      
    } else {
      // ✅ Crear nuevo turno
      console.log('➕ [CalendarPage] Creando turno:', backendPayload);
      
      // Verificar que los datos sean válidos
      if (!backendPayload.employee || isNaN(backendPayload.employee)) {
        throw new Error('ID de empleado inválido');
      }
      if (!backendPayload.shift_type || isNaN(backendPayload.shift_type)) {
        throw new Error('ID de tipo de turno inválido');
      }
      
      const newShift = await shiftService.createShift(backendPayload);
      
      console.log('✅ [CalendarPage] Turno creado:', newShift);
      
      // Agregar al estado local
      const calendarShift = {
        id: newShift.id,
        title: `${shiftData.employeeName} - ${shiftData.shiftTypeName}`,
        start: `${newShift.date}T${newShift.start_time}`,
        end: `${newShift.date}T${newShift.end_time}`,
        backgroundColor: shiftData.backgroundColor,
        color: shiftData.backgroundColor,
        extendedProps: {
          employeeId: newShift.employee,
          employeeName: shiftData.employeeName,
          shiftTypeId: newShift.shift_type,
          shiftTypeName: shiftData.shiftTypeName,
          role: shiftData.role,
          notes: newShift.notes
        }
      };
      
      setShifts(prev => [...prev, calendarShift]);
      showNotification('success', 'Turno creado exitosamente');
    }
    
    setIsShiftModalOpen(false);
    setEditingShift(null);
    
  } catch (error) {
    console.error('❌ [CalendarPage] Error saving shift:', error);
    console.error('Error details:', error.response?.data);
    
    let errorMessage = 'Error al guardar el turno';

    // Mensaje especial para errores de conflicto o internal server que suelen ocurrir
    // cuando otro proceso (p.ej. una solicitud de cambio) modificó el turno simultáneamente.
    const detail = error.response?.data?.detail || '';
    if (error.message && error.message.includes('inválido')) {
      errorMessage = error.message;
    } else if (detail && typeof detail === 'string' && /cambio|solicitud|conflict|modified|already|updated|actualiz/i.test(detail)) {
      errorMessage = 'No se pudo actualizar el turno porque pudo haber sido modificado por otra acción (por ejemplo, una solicitud de cambio aceptada). Actualiza la página y verifica el turno.';
    } else if (error.response?.status === 500) {
      // Backend devolvió 500 -> mostrar mensaje más amigable y sugerente
      errorMessage = 'No se pudo actualizar el turno: el servidor devolvió un error. Es posible que el turno haya sido modificado por otra acción (p.ej. una solicitud de cambio). Por favor actualiza la página y verifica el estado.';
      // Si hay detalle concreto, añadirlo brevemente
      if (detail) errorMessage += ` Detalle: ${detail}`;
    } else if (error.response?.data?.employee) {
      errorMessage = `Error de empleado: ${error.response.data.employee}`;
    } else if (error.response?.data?.shift_type) {
      errorMessage = `Error de tipo de turno: ${error.response.data.shift_type}`;
    } else if (detail) {
      errorMessage = detail;
    } else if (error.message) {
      errorMessage = error.message;
    }

    showNotification('error', errorMessage);
  }
};

  const handleEventClick = (event) => {
  console.log('🔓 [CalendarPage] Abriendo modal con evento:', {
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    extendedProps: event.extendedProps
  });

  // ✅ Buscar el shift completo
  const shift = shifts.find(s => String(s.id) === String(event.id));
  
  if (!shift) {
    console.error('❌ Shift no encontrado para ID:', event.id);
    showNotification('error', 'No se pudo cargar la información del turno');
    return;
  }

  if (shift.is_locked || shift.isLocked) {
    console.warn('🔒 Turno bloqueado:', shift.lock_reason || shift.lockReason);
  }

  console.log('✅ Shift encontrado completo:', shift);
  console.log('📝 ExtendedProps del shift:', shift.extendedProps);

  // ✅ Extraer todos los datos correctamente
  const employeeId = shift.extendedProps?.employeeId || event.extendedProps?.employeeId;
  const shiftTypeId = shift.extendedProps?.shiftTypeId || event.extendedProps?.shiftTypeId;
  const notes = shift.extendedProps?.notes || event.extendedProps?.notes || '';
  const role = shift.extendedProps?.role || event.extendedProps?.role || '';
  
  console.log('📝 Notas extraídas:', notes);
  console.log('👔 Rol extraído:', role);
  
  // ✅ Si no encontramos el employeeId, intentar buscarlo por nombre
  let finalEmployeeId = employeeId;
  if (!finalEmployeeId && shift.extendedProps?.employeeName) {
    const foundEmployee = employees.find(emp => 
      emp.name === shift.extendedProps.employeeName ||
      `${emp.first_name} ${emp.last_name}`.trim() === shift.extendedProps.employeeName
    );
    if (foundEmployee) {
      finalEmployeeId = foundEmployee.id;
      console.log('✅ EmployeeId encontrado por nombre:', finalEmployeeId);
    }
  }

  // ✅ Buscar shiftTypeId por nombre si no existe
  let finalShiftTypeId = shiftTypeId;
  if (!finalShiftTypeId && shift.extendedProps?.shiftTypeName) {
    const foundShiftType = shiftTypes.find(type => 
      type.name === shift.extendedProps.shiftTypeName
    );
    if (foundShiftType) {
      finalShiftTypeId = foundShiftType.id;
      console.log('✅ ShiftTypeId encontrado por nombre:', finalShiftTypeId);
    }
  }

  // ✅ CRÍTICO: Asegurar que el ID del turno se pase correctamente
  const shiftForModal = {
    id: shift.id, // ✅ Esto es lo más importante
    employeeId: finalEmployeeId,
    employeeName: shift.extendedProps?.employeeName || shift.title?.split(' - ')[0] || '',
    shiftTypeId: finalShiftTypeId,
    shiftTypeName: shift.extendedProps?.shiftTypeName || '',
    start: shift.start || event.start,
    end: shift.end || event.end,
    role: role,
    notes: notes,
    backgroundColor: shift.backgroundColor || shift.color || event.backgroundColor,
    is_locked: shift.is_locked || shift.isLocked || false,
    lock_reason: shift.lock_reason || shift.lockReason || '',
    locked_at: shift.locked_at || shift.lockedAt || null
  };

  console.log('📤 Datos completos para modal:', shiftForModal);
  console.log('🔑 ID del turno que se va a editar:', shiftForModal.id); // ✅ Verificar que no sea null

  // ✅ CRÍTICO: Verificar que tenemos el ID antes de abrir el modal
  if (!shiftForModal.id) {
    console.error('❌ ERROR: No se pudo determinar el ID del turno');
    showNotification('error', 'No se pudo cargar el turno para editar');
    return;
  }

  setEditingShift(shiftForModal);
  setIsShiftModalOpen(true);
};

  const handleDeleteShift = async (shiftId) => {
    try {
      await shiftService.deleteShift(shiftId);
      setShifts(prev => prev.filter(shift => shift.id !== shiftId));
      showNotification('success', 'Horario eliminado');
    } catch (error) {
      console.error('Error deleting shift:', error);
      showNotification('error', 'Error al eliminar el turno');
    }
  };

  const handleDuplicateShifts = async (duplicateData) => {
  try {
    console.log('🔄 [CalendarPage] Duplicando turnos - Data recibida:', duplicateData);

    // ✅ Validar que todos los campos existan
    if (!duplicateData.sourceStartDate) {
      throw new Error('sourceStartDate es requerido');
    }
    if (!duplicateData.sourceEndDate) {
      throw new Error('sourceEndDate es requerido');
    }
    if (!duplicateData.targetStartDate) {
      throw new Error('targetStartDate es requerido');
    }
    if (!duplicateData.targetEndDate) {
      throw new Error('targetEndDate es requerido');
    }

    // ✅ CORRECCIÓN: Enviar datos sin mapear - shiftService lo hará
    console.log('📤 [CalendarPage] Enviando a shiftService (sin mapear):', duplicateData);

    const result = await shiftService.duplicateShifts(duplicateData);
    
    console.log('✅ [CalendarPage] Resultado de duplicación:', result);
    
    // Recargar los turnos completos
    await initializeData();
    
    // Mostrar notificación según el resultado
    if (result.conflicts > 0) {
      showNotification(
        'warning', 
        `Duplicación completada: ${result.created} turno(s) creado(s), ${result.conflicts} con conflictos omitido(s)`
      );
    } else {
      showNotification('success', `Duplicación completada: ${result.created} turno(s) creado(s)`);
    }

    setIsDuplicateModalOpen(false);
  } catch (error) {
    console.error('❌ [CalendarPage] Error duplicating shifts:', error);
    console.error('❌ Error completo:', error.message);
    showNotification('error', error.message || 'Error al duplicar los turnos');
  }
};

  const handleEventDrop = async (info) => {
    try {
      const newStart = new Date(info.event.start);
      const newEnd = new Date(info.event.end);

      // Validar que no sea antes de las 6 AM
      const startHour = newStart.getHours();
      if (startHour < 6 && startHour >= 0) {
        info.revert();
        showNotification('error', 'Los turnos no pueden comenzar antes de las 06:00 AM');
        return;
      }

      // Obtener el turno original
      const originalShift = shifts.find(s => s.id === info.event.id);
      if (!originalShift) {
        console.error('Turno original no encontrado');
        info.revert();
        return;
      }

      // Preparar datos para actualizar
      const updateData = {
        date: newStart.toISOString().split('T')[0],
        start_time: newStart.toTimeString().slice(0, 5),
        end_time: newEnd.toTimeString().slice(0, 5),
        employee: originalShift.extendedProps?.employeeId,
        shift_type: originalShift.extendedProps?.shiftTypeId,
        role: originalShift.extendedProps?.role,
        notes: originalShift.extendedProps?.notes
      };

      // Actualizar en el backend
      await shiftService.updateShift(originalShift.id, updateData);

      // Actualizar en el estado local
      setShifts(prev => prev.map(shift => {
        if (shift.id === originalShift.id) {
          return {
            ...shift,
            start: info.event.start.toISOString(),
            end: info.event.end.toISOString()
          };
        }
        return shift;
      }));

      showNotification('success', 'Turno actualizado exitosamente');
    } catch (error) {
      console.error('Error updating shift:', error);
      info.revert();
      showNotification('error', 'Error al actualizar el turno');
    }
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