// services/shiftService.js

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
    
    // ✅ CORREGIDO: Usar employeeId (employee_id) en lugar de user_id
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
      employee: parseInt(employeeValue),  // ✅ EMPLOYEE_ID (de la tabla shifts_employee)
      shift_type: parseInt(shiftData.shiftTypeId || shiftData.shift_type),
      notes: shiftData.notes || ''
    };

    console.log('📤 [shiftService] updateShift - Payload final:', payload);
    
    const response = await shiftAPI.updateShift(shiftId, payload);
    console.log('✅ [shiftService] updateShift - Response:', response);
    return response;
    
  } catch (error) {
    console.error('❌ [shiftService] Error updating shift:', error.response?.data);
    const errorMsg = error.response?.data?.detail || 
                     error.response?.data?.conflict || 
                     error.message || 
                     'Error al actualizar turno';
    throw new Error(errorMsg);
  }
},

  // ========================================
  // OBTENER TURNOS PARA CALENDARIO
  // ========================================
  // services/shiftService.js - REEMPLAZAR getShiftsForCalendar COMPLETO

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

      // ✅ ESTRUCTURA CORRECTA PARA FULLCALENDAR
      return {
        id: shift.id,
        title,
        start,
        end,
        color,
        backgroundColor: color,
        borderColor: color,
        
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
          end_time: shift.end_time || shift.endTime
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
  // OTROS MÉTODOS
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

  deleteShift: async (shiftId) => {
    try {
      const response = await shiftAPI.deleteShift(shiftId);
      return response;
    } catch (error) {
      console.error('❌ [shiftService] Error deleting shift:', error);
      throw new Error(error.response?.data?.detail || 'Error al eliminar turno');
    }
  },

  duplicateShifts: async (duplicateData) => {
    try {
      const payload = {
        start_date: duplicateData.sourceStartDate,
        end_date: duplicateData.sourceEndDate,
        target_start_date: duplicateData.targetStartDate
      };

      console.log('[shiftService] duplicateShifts - Payload:', payload);
      
      if (!payload.start_date || !payload.end_date || !payload.target_start_date) {
        throw new Error('Las fechas de origen y destino son requeridas');
      }

      const response = await shiftAPI.duplicateShifts(payload);
      console.log('[shiftService] duplicateShifts - Response:', response);
      
      return response;
    } catch (error) {
      console.error('❌ [shiftService] Error duplicating shifts:', error);
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
};

export default shiftService;