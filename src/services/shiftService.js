// services/shiftService.js - VERSIÓN MEJORADA CON SISTEMA DE RECORDATORIOS

import authApi, { shiftAPI } from '../api/Axios';

// Helper: asegura formato HH:MM:SS para horas (acepta "09:00" o "09:00:00")
const padSeconds = (t) => {
  if (!t) return undefined;
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
  const match = String(t).match(/(\d{2}:\d{2})/);
  if (match) return `${match[1]}:00`;
  return undefined;
};

// Helper: detecta si un rango de tiempo cruza medianoche (p.ej. 22:00 - 06:00)
const isOvernight = (startTime, endTime) => {
  if (!startTime || !endTime) return false;
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  return end < start;
};

export const shiftService = {
  // ========================================
  // CREAR TURNO
  // ========================================
  createShift: async (shiftData) => {
    try {
      console.log('🔄 [shiftService] createShift - Data recibida:', shiftData);
      
      // ✅ Payload - employee es USER_ID
      const payload = {
        date: shiftData.date,
        start_time: padSeconds(shiftData.start_time),
        end_time: padSeconds(shiftData.end_time),
        employee: parseInt(shiftData.employee),  // ✅ USER_ID
        shift_type: parseInt(shiftData.shift_type),
        notes: shiftData.notes || ''
      };

      // Validaciones
      if (!payload.employee || isNaN(payload.employee)) {
        throw new Error('employee ID is required and must be a number');
      }
      if (!payload.shift_type || isNaN(payload.shift_type)) {
        throw new Error('shift_type ID is required and must be a number');
      }
      if (!payload.date) {
        throw new Error('date is required');
      }
      if (!payload.start_time) {
        throw new Error('start_time is required');
      }
      if (!payload.end_time) {
        throw new Error('end_time is required');
      }

      console.log('📤 [shiftService] createShift - Payload final:', payload);
      
      const response = await shiftAPI.createShift(payload);
      console.log('✅ [shiftService] createShift - Response:', response);
      
      // ✅ NUEVO: Mostrar información de recordatorios programados
      console.log('⏰ [shiftService] Recordatorios programados automáticamente para este turno');
      console.log('   - 1 hora antes del turno');
      console.log('   - 30 minutos antes del turno');
      
      return response;
      
    } catch (error) {
      console.error('❌ [shiftService] Error creating shift:', error);
      console.error('❌ Error response data:', error.response?.data);
      
      // Manejar errores del backend
      const errorData = error.response?.data;
      if (errorData && typeof errorData === 'object') {
        const errorMessages = [];
        Object.keys(errorData).forEach(key => {
          const val = errorData[key];
          if (Array.isArray(val)) {
            errorMessages.push(`${key}: ${val.join(', ')}`);
          } else if (typeof val === 'string') {
            errorMessages.push(`${key}: ${val}`);
          }
        });
        if (errorMessages.length > 0) {
          throw new Error(errorMessages.join(' | '));
        }
      }
      
      throw new Error(error.response?.data?.detail || error.message || 'Error al crear turno');
    }
  },

  // ========================================
  // ACTUALIZAR TURNO
  // ========================================
  updateShift: async (shiftId, shiftData) => {
    try {
      console.log('🔄 [shiftService] updateShift - Data recibida:', shiftData);
      
      const employeeValue = shiftData.employeeId || 
                           shiftData.employee_id || 
                           shiftData.employee;

      console.log('🔍 [shiftService] updateShift - IDs disponibles:', {
        employeeId: shiftData.employeeId,
        employee_id: shiftData.employee_id,
        employee: shiftData.employee,
        employee_user_id: shiftData.employee_user_id,
        employeeUserId: shiftData.employeeUserId,
        employeeValueSelected: employeeValue
      });

      const payload = {
        date: shiftData.date,
        start_time: padSeconds(shiftData.start_time || shiftData.startTime),
        end_time: padSeconds(shiftData.end_time || shiftData.endTime),
        employee: parseInt(employeeValue),
        shift_type: parseInt(shiftData.shiftTypeId || shiftData.shift_type),
        notes: shiftData.notes || ''
      };

      console.log('📤 [shiftService] updateShift - Payload final:', payload);
      
      const response = await shiftAPI.updateShift(shiftId, payload);
      console.log('✅ [shiftService] updateShift - Response:', response);
      
      // ✅ NUEVO: Informar sobre reprogramación de recordatorios
      console.log('🔄 [shiftService] Recordatorios reprogramados automáticamente');
      
      return response;
      
    } catch (error) {
      console.error('❌ [shiftService] Error updating shift:', error.response?.data);
      
      // ✅ MEJORA: Manejo específico para errores de edición
      const errorStatus = error.response?.status;
      const errorData = error.response?.data;
      
      let errorMsg = 'Error al actualizar turno';
      
      // ✅ CASO ESPECÍFICO: Error 500 en edición (muy probablemente por cambio aceptado)
      if (errorStatus === 500) {
        errorMsg = 'No se pudo actualizar el turno porque ya se aceptó una solicitud de cambio. El turno ha sido modificado recientemente.';
      }
      // ✅ CASO: Conflicto explícito
      else if (errorStatus === 409) {
        errorMsg = 'El turno ha sido modificado por otro usuario o proceso. Actualiza la página.';
      }
      // ✅ CASO: Error de validación
      else if (errorStatus === 400) {
        errorMsg = errorData?.detail || 'Datos inválidos para actualizar el turno';
      }
      // ✅ CASO: Mensaje específico del backend
      else if (errorData?.detail) {
        errorMsg = errorData.detail;
      }
      // ✅ CASO: Mensaje de conflicto genérico
      else if (errorData?.conflict || errorData?.error) {
        const conflictMsg = errorData.conflict || errorData.error;
        errorMsg = conflictMsg;
      }

      throw new Error(errorMsg);
    }
  },

  // ========================================
  // OBTENER TURNOS PARA CALENDARIO
  // ========================================
  getShiftsForCalendar: async () => {
    try {
      console.log('🔄 [shiftService] Obteniendo turnos para calendario...');
      const response = await shiftAPI.getShifts();

      if (!response) {
        console.warn('⚠️ [shiftService] Respuesta vacía de getShifts');
        return [];
      }

      const shiftsData = Array.isArray(response) ? response : (response.results || response.data || []);
      console.log(`✅ [shiftService] Se obtuvieron ${shiftsData.length} turnos`);

      if (shiftsData.length > 0) {
        console.log('📊 [shiftService] Primer turno RAW del backend:', shiftsData[0]);
      }

      const shifts = shiftsData.map(shift => {
        // Construir fechas ISO
        const start = shift.start || (shift.date && shift.start_time ? `${shift.date}T${shift.start_time}` : null);
        const end = shift.end || (shift.date && shift.end_time ? `${shift.date}T${shift.end_time}` : null);

        if (!start || !end) {
          console.warn('⚠️ [shiftService] Turno con start/end inválidos:', shift);
          return null;
        }

        // ✅ CRÍTICO: Extraer IDs correctos
        const employee_db_id = shift.employee_id;           // Employee ID en BD
        const employee_user_id = shift.employee_user_id || shift.employeeUserId;  // ✅ USER_ID
        
        console.log(`📋 [shiftService] Turno ${shift.id} - IDs:`, {
          employee_db_id,    // ✅ Este es el que usa el backend
          employee_user_id,  // Este es para el frontend
          employee_name: shift.employee_name,
          shift_data: shift
        });

        const employeeName = shift.employee || shift.employee_name || '';
        const role = shift.role || '';
        const notes = shift.notes || '';
        
        const title = employeeName && role ? `${employeeName} - ${role}` : employeeName || 'Sin empleado';
        const color = shift.shift_type_color || shift.color || '#3788d8';

        const isLocked = shift.is_locked || shift.isLocked || false;
        const lockReason = shift.lock_reason || shift.lockReason || '';
        const lockedAt = shift.locked_at || shift.lockedAt || null;

        console.log(`🔒 [shiftService] Turno ${shift.id} - Bloqueo:`, {
          isLocked,
          lockReason,
          lockedAt
        });

        // ✅ ESTRUCTURA CORRECTA PARA FULLCALENDAR
        return {
          id: shift.id,
          title,
          start,
          end,
          color,
          backgroundColor: color,
          borderColor: color,

          is_locked: isLocked,
          isLocked: isLocked,
          lock_reason: lockReason,
          lockReason: lockReason,
          locked_at: lockedAt,
          lockedAt: lockedAt,
          
          // ✅ CRÍTICO: employeeUserId en nivel superior (para ShiftModal)
          employeeId: employee_db_id,           // Employee ID en BD
          employeeUserId: employee_user_id,     // ✅ USER_ID (para editar)
          employeeName,
          shiftTypeId: shift.shift_type_id || shift.shiftTypeId,
          shiftTypeName: shift.shift_type_name || shift.shiftTypeName,
          role,
          notes,
          
          // ✅ CRÍTICO: extendedProps con TODOS los datos
          extendedProps: {
            employeeId: employee_db_id,         // Employee ID en BD
            employeeUserId: employee_user_id,   // ✅ USER_ID (para editar)
            employeeName,
            shiftTypeId: shift.shift_type_id || shift.shiftTypeId,
            shiftTypeName: shift.shift_type_name || shift.shiftTypeName,
            role,
            notes,
            date: shift.date,
            start_time: shift.start_time || shift.startTime,
            end_time: shift.end_time || shift.endTime,

            is_locked: isLocked,
            isLocked: isLocked,
            lock_reason: lockReason,
            lockReason: lockReason,
            locked_at: lockedAt,
            lockedAt: lockedAt
          }
        };
      }).filter(Boolean);

      console.log('✅ [shiftService] Turnos formateados:', shifts.length);
      if (shifts.length > 0) {
        console.log('📊 [shiftService] Primer turno FORMATEADO:', shifts[0]);
        console.log('📊 [shiftService] extendedProps del primer turno:', shifts[0].extendedProps);
      }

      return shifts;
    } catch (error) {
      console.error('❌ [shiftService] Error fetching shifts for calendar:', error);
      throw error;
    }
  },

  // ========================================
  // ELIMINAR TURNO
  // ========================================
  deleteShift: async (shiftId) => {
    try {
      console.log(`🗑️ [shiftService] Eliminando turno ${shiftId}...`);
      
      const response = await shiftAPI.deleteShift(shiftId);
      
      // ✅ NUEVO: Informar sobre cancelación de recordatorios
      console.log(`⏰ [shiftService] Recordatorios cancelados automáticamente para el turno ${shiftId}`);
      
      return response;
    } catch (error) {
      console.error('❌ [shiftService] Error deleting shift:', error);
      throw new Error(error.response?.data?.detail || 'Error al eliminar turno');
    }
  },

  // ========================================
  // SISTEMA DE RECORDATORIOS - NUEVOS MÉTODOS
  // ========================================
  
  /**
   * Probar el sistema de recordatorios manualmente
   */
  testReminders: async () => {
    try {
      console.log('🧪 [shiftService] Probando sistema de recordatorios...');
      
      const response = await shiftAPI.testReminders();
      console.log('✅ [shiftService] Test de recordatorios completado:', response);
      
      return response;
    } catch (error) {
      console.error('❌ [shiftService] Error probando recordatorios:', error);
      throw new Error(error.response?.data?.error || 'Error probando recordatorios');
    }
  },

  /**
   * Reprogramar todos los recordatorios para turnos futuros
   */
  scheduleAllReminders: async () => {
    try {
      console.log('🔄 [shiftService] Reprogramando todos los recordatorios...');
      
      const response = await shiftAPI.scheduleAllReminders();
      console.log('✅ [shiftService] Recordatorios reprogramados:', response);
      
      return response;
    } catch (error) {
      console.error('❌ [shiftService] Error reprogramando recordatorios:', error);
      throw new Error(error.response?.data?.error || 'Error reprogramando recordatorios');
    }
  },

  /**
   * Obtener información del sistema de recordatorios
   */
  getRemindersInfo: async () => {
    try {
      console.log('📊 [shiftService] Obteniendo información de recordatorios...');
      
      // Esta sería una nueva endpoint que podrías crear en el backend
      const response = await shiftAPI.getRemindersInfo();
      return response;
    } catch (error) {
      console.error('❌ [shiftService] Error obteniendo información de recordatorios:', error);
      return {
        total_reminders: 0,
        pending_reminders: 0,
        sent_reminders: 0,
        coverage_percentage: 0
      };
    }
  },

  // ========================================
  // OTROS MÉTODOS EXISTENTES
  // ========================================
  
  getShifts: async (params = {}) => {
    try {
      const response = await shiftAPI.getShifts(params);
      return response;
    } catch (error) {
      console.error('❌ [shiftService] Error fetching shifts:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener turnos');
    }
  },

  getShift: async (shiftId) => {
    try {
      const response = await shiftAPI.getShift(shiftId);
      return response;
    } catch (error) {
      console.error('❌ [shiftService] Error fetching shift:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener turno');
    }
  },

  duplicateShifts: async (duplicateData) => {
    try {
      console.log('🔄 [shiftService] duplicateShifts - Datos recibidos:', duplicateData);
      
      // ✅ CRÍTICO: Validar que TODOS los campos existan ANTES de construir payload
      const requiredFields = ['sourceStartDate', 'sourceEndDate', 'targetStartDate', 'targetEndDate'];
      const missingFields = requiredFields.filter(field => !duplicateData[field]);
      
      if (missingFields.length > 0) {
        const error = `Campos faltantes: ${missingFields.join(', ')}`;
        console.error('❌ [shiftService]', error);
        throw new Error(error);
      }

      // ✅ Construir payload
      const payload = {
        start_date: duplicateData.sourceStartDate,
        end_date: duplicateData.sourceEndDate,
        target_start_date: duplicateData.targetStartDate,
        target_end_date: duplicateData.targetEndDate
      };

      console.log('📤 [shiftService] Payload construido:', payload);
      
      // ✅ Validar payload antes de enviar
      if (!payload.start_date || !payload.end_date || !payload.target_start_date || !payload.target_end_date) {
        const error = 'Las fechas de origen y destino son requeridas';
        console.error('❌ [shiftService] Validación fallida:', {
          start_date: payload.start_date,
          end_date: payload.end_date,
          target_start_date: payload.target_start_date,
          target_end_date: payload.target_end_date
        });
        throw new Error(error);
      }

      console.log('✅ [shiftService] Enviando request al backend...');
      const response = await shiftAPI.duplicateShifts(payload);
      
      console.log('✅ [shiftService] duplicateShifts - Response:', response);
      
      // ✅ NUEVO: Informar sobre recordatorios programados para turnos duplicados
      console.log('⏰ [shiftService] Recordatorios programados automáticamente para los turnos duplicados');
      
      return response;
      
    } catch (error) {
      console.error('❌ [shiftService] Error duplicating shifts:', error);
      console.error('❌ Error response:', error.response?.data);
      throw new Error(error.response?.data?.error || error.response?.data?.detail || error.message || 'Error al duplicar turnos');
    }
  },

  // ========================================
  // TIPOS DE TURNO
  // ========================================
  
  getShiftTypes: async () => {
    try {
      console.log('🔄 [shiftService] Obteniendo tipos de turno...');
      const response = await shiftAPI.getShiftTypes();
      
      if (!response) {
        console.warn('⚠️ [shiftService] Respuesta vacía de getShiftTypes');
        return [];
      }
      
      const shiftTypes = Array.isArray(response) ? response : response.results || response.data || [];
      console.log(`✅ [shiftService] Se obtuvieron ${shiftTypes.length} tipos de turno`);
      return shiftTypes;
    } catch (error) {
      console.error('❌ [shiftService] Error fetching shift types:', error);
      throw error;
    }
  },

  createShiftType: async (shiftTypeData) => {
    try {
      console.log('🔄 [shiftService] Creando tipo de turno...', shiftTypeData);
      
      if (!shiftTypeData.name?.trim()) {
        throw new Error('El nombre es requerido');
      }
      if (!shiftTypeData.start_time && !shiftTypeData.startTime) {
        throw new Error('La hora de inicio es requerida');
      }
      if (!shiftTypeData.end_time && !shiftTypeData.endTime) {
        throw new Error('La hora de fin es requerida');
      }

      const payload = {
        name: shiftTypeData.name.trim(),
        start_time: padSeconds(shiftTypeData.start_time || shiftTypeData.startTime),
        end_time: padSeconds(shiftTypeData.end_time || shiftTypeData.endTime),
        color: shiftTypeData.color || '#3788d8'
      };

      console.log('📤 [shiftService] Payload para crear tipo de turno:', payload);
      
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (!timeRegex.test(payload.start_time) || !timeRegex.test(payload.end_time)) {
        throw new Error('Formato de hora inválido. Use HH:MM o HH:MM:SS');
      }

      const isOvernightShift = isOvernight(payload.start_time, payload.end_time);
      
      if (!isOvernightShift) {
        const start = new Date(`1970-01-01T${payload.start_time}`);
        const end = new Date(`1970-01-01T${payload.end_time}`);
        if (start >= end) {
          throw new Error('La hora de fin debe ser mayor a la hora de inicio');
        }
      }

      const response = await shiftAPI.createShiftType(payload);
      console.log('✅ [shiftService] Tipo de turno creado exitosamente:', response);
      
      return response;
    } catch (error) {
      console.error('❌ [shiftService] Error creating shift type:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          const errorMessages = Object.entries(errorData).map(([key, value]) => {
            if (Array.isArray(value)) return `${key}: ${value.join(', ')}`;
            return `${key}: ${value}`;
          });
          throw new Error(errorMessages.join(' | '));
        }
        throw new Error(errorData.detail || errorData.error || 'Error del servidor');
      }
      
      throw error;
    }
  },

  updateShiftType: async (shiftTypeId, shiftTypeData) => {
    try {
      const payload = {
        name: shiftTypeData.name || shiftTypeData.title || '',
        start_time: padSeconds(shiftTypeData.start_time || shiftTypeData.startTime),
        end_time: padSeconds(shiftTypeData.end_time || shiftTypeData.endTime),
        color: shiftTypeData.color || shiftTypeData.colorHex 
      };

      console.log('[shiftService] updateShiftType payload:', payload);

      const response = await shiftAPI.updateShiftType(shiftTypeId, payload);
      return response;
    } catch (error) {
      console.error('❌ [shiftService] Error updating shift type:', error);
      throw new Error(error.response?.data?.detail || error.message || 'Error al actualizar tipo de turno');
    }
  },

  deleteShiftType: async (shiftTypeId) => {
    try {
      const response = await shiftAPI.deleteShiftType(shiftTypeId);
      return response;
    } catch (error) {
      console.error('❌ [shiftService] Error deleting shift type:', error);
      throw new Error(error.response?.data?.detail || 'Error al eliminar tipo de turno');
    }
  },

  // ========================================
  // EMPLEADOS
  // ========================================
  
  getEmployees: async () => {
    try {
      console.log('🔄 [shiftService] Obteniendo usuarios para turnos...');
      
      const resp = await authApi.get('/users/for-shifts/');
      
      if (resp && resp.data) {
        const users = resp.data;
        console.log(`✅ [shiftService] Se obtuvieron ${users.length} usuarios`);
        
        // ✅ Mapear a formato esperado - id es USER_ID pero incluir employee_id
        const employees = users.map(user => ({
          id: user.user_id,                    // ✅ USER_ID (para el formulario)
          employee_id: user.employee_id,        // ✅ EMPLOYEE_ID (para el backend - CRÍTICO)
          name: user.name,
          position: user.position,
          departamento: user.departamento,
          has_employee: user.has_employee
        }));
        
        console.log('✅ [ShiftModal] Usuarios mapeados (primeros 3):', employees.slice(0, 3));
        return employees;
      }
      
      return [];
    } catch (error) {
      console.error('❌ [shiftService] Error obteniendo usuarios:', error);
      return [];
    }
  },

  // ========================================
  // MIS TURNOS (PARA EMPLEADOS)
  // ========================================
  
  getMyShifts: async (params = {}) => {
    try {
      console.log('🔄 [shiftService] Obteniendo mis turnos...');
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️ [shiftService] No hay token de autenticación');
        return [];
      }
      
      const response = await shiftAPI.getMyShifts(params);
      
      if (!response) {
        console.warn('⚠️ [shiftService] Respuesta vacía de getMyShifts');
        return [];
      }
      
      const shiftsData = Array.isArray(response) ? response : (response.results || response.data || []);
      console.log(`✅ [shiftService] Se obtuvieron ${shiftsData.length} turnos propios`);
      
      return shiftsData;
    } catch (error) {
      console.error('❌ [shiftService] Error fetching my shifts:', error);
      return [];
    }
  },
  
  getMyShiftsForCalendar: async (params = {}) => {
    try {
      console.log('🔄 [shiftService] Obteniendo mis turnos para calendario con params:', params);
      const shiftsData = await shiftService.getMyShifts(params);
      
      if (!Array.isArray(shiftsData) || shiftsData.length === 0) {
        console.log('📭 [shiftService] No hay turnos para mostrar');
        return [];
      }
      
      console.log('📊 Turnos raw recibidos:', shiftsData.length);
      
      const shifts = shiftsData.map(shift => {
        const startISO = shift.start || (shift.date && shift.start_time ? `${shift.date}T${shift.start_time}` : null);
        const endISO = shift.end || (shift.date && shift.end_time ? `${shift.date}T${shift.end_time}` : null);
        
        if (!startISO || !endISO) {
          console.warn('⚠️ Turno sin start/end:', shift);
          return null;
        }
        
        const startDate = new Date(startISO);
        const endDate = new Date(endISO);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.warn('⚠️ Fechas inválidas:', { startISO, endISO });
          return null;
        }
        
        const employeeName = shift.employee_name || '';
        const shiftTypeName = shift.shift_type_name || 'Turno';
        const role = shift.employee_position || shift.role || '';
        const notes = shift.notes || '';
        const color = shift.shift_type_color;
        
        return {
          id: shift.id,
          title: role ? `${shiftTypeName} - ${role}` : shiftTypeName,
          start: startDate,
          end: endDate,
          backgroundColor: color,
          borderColor: color,
          textColor: 'white',
          extendedProps: {
            employeeId: shift.employee,
            employeeName,
            employeePosition: shift.employee_position,
            shiftTypeId: shift.shift_type,
            shiftTypeName,
            role,
            notes,
            color
          }
        };
      }).filter(Boolean);
      
      console.log('✅ [shiftService] Turnos formateados para calendario:', shifts.length);
      return shifts;
    } catch (error) {
      console.error('❌ [shiftService] Error fetching my shifts for calendar:', error);
      throw error;
    }
  },

  getEmployeeShifts: async (employeeId) => {
    try {
      console.log('🔄 [shiftService] Obteniendo turnos del empleado:', employeeId);
      
      if (!employeeId) {
        console.warn('⚠️ [shiftService] getEmployeeShifts llamado sin employeeId');
        return [];
      }

      // ✅ CORRECCIÓN: Usar ruta absoluta con /api/shifts/
      const response = await authApi.get(`https://shift-scheduler-main-production.up.railway.app/api/shifts/employees/${employeeId}/shifts/`);
      
      console.log('📦 [shiftService] Respuesta completa:', response);
      
      const shiftsData = response.data?.results || response.data || [];
      console.log(`✅ [shiftService] Turnos del empleado obtenidos:`, shiftsData.length);
      
      // Debug: ver estructura completa
      if (shiftsData.length > 0) {
        console.log('🔍 Estructura del primer turno del empleado:', {
          id: shiftsData[0].id,
          date: shiftsData[0].date,
          start_time: shiftsData[0].start_time,
          end_time: shiftsData[0].end_time,
          shift_type_name: shiftsData[0].shift_type_name,
          shift_type_id: shiftsData[0].shift_type_id,
          shift_type: shiftsData[0].shift_type,
          all_fields: Object.keys(shiftsData[0])
        });
      }

      // Si algunos turnos vienen con shift_type_id (o shift_type) pero sin nombre,
      // intentar obtener la lista de tipos de turno y mapearlos para adjuntar el nombre.
      try {
        const shiftTypes = await shiftService.getShiftTypes();
        const mapById = new Map();
        (shiftTypes || []).forEach(st => {
          const id = st.id ?? st.shift_type_id ?? st.pk ?? st.key ?? null;
          const name = st.name || st.title || st.shift_type_name || st.label || null;
          if (id != null && name) mapById.set(String(id), name);
        });

        // Adjuntar nombre cuando falte
        shiftsData.forEach(s => {
          if (!s.shift_type_name) {
            const idCandidate = s.shift_type_id ?? s.shift_type ?? s.type_id ?? s.type;
            const mapped = idCandidate != null ? mapById.get(String(idCandidate)) : null;
            if (mapped) s.shift_type_name = mapped;
          }
        });
      } catch (err) {
        console.warn('[shiftService] No se pudieron resolver nombres de tipos de turno:', err);
      }

      return shiftsData;
    } catch (error) {
      console.error('❌ [shiftService] Error obteniendo turnos del empleado:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      return [];
    }
  },
  
};

export default shiftService;