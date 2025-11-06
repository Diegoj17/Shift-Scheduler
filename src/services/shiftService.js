import { shiftAPI } from '../api/Axios';

// Helper: asegura formato HH:MM:SS para horas (acepta "09:00" o "09:00:00")
const padSeconds = (t) => {
  if (!t) return undefined;
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
  const match = String(t).match(/(\d{2}:\d{2})/);
  if (match) return `${match[1]}:00`;
  return undefined;
};

const mapFrontendToBackend = (f) => ({
  name: f.name,
  start_time: padSeconds(f.start_time || f.startTime),
  end_time: padSeconds(f.end_time || f.endTime),
  color: f.color
});
// Helper: detecta si un rango de tiempo cruza medianoche (p.ej. 22:00 - 06:00)
const isOvernight = (startTime, endTime) => {
  if (!startTime || !endTime) return false;
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  return end < start; // Si end es menor que start, cruza medianoche
};

export const shiftService = {
  // Crear un nuevo turno
  createShift: async (shiftData) => {
  try {
    // Debug
    console.log('[shiftService] createShift - Data recibida:', shiftData);
    
    // ✅ Mapeo directo y simple
    const payload = {
      date: shiftData.date,
      start_time: padSeconds(shiftData.start_time),
      end_time: padSeconds(shiftData.end_time),
      employee: parseInt(shiftData.employee),
      shift_type: parseInt(shiftData.shift_type),
      notes: shiftData.notes || ''
    };

    // Validación
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

    console.log('[shiftService] createShift - Payload final:', payload);
    
    const response = await shiftAPI.createShift(payload);
    console.log('[shiftService] createShift - Response:', response);
    return response;
    
  } catch (error) {
    console.error('[shiftService] Error creating shift:', error);
    console.error('[shiftService] Error response data:', error.response?.data);
    
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

  // Obtener todos los turnos
  getShifts: async (params = {}) => {
    try {
      const response = await shiftAPI.getShifts(params);
      return response;
    } catch (error) {
      console.error('Error fetching shifts:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener turnos');
    }
  },

  // Obtener turnos para calendario
  getShiftsForCalendar: async () => {
  try {
    console.log('🔄 shiftService: Obteniendo turnos para calendario...');
    const response = await shiftAPI.getShifts();

    if (!response) {
      console.warn('⚠️ shiftService: Respuesta vacía de getShifts');
      return [];
    }

    const shiftsData = Array.isArray(response) ? response : (response.results || response.data || []);
    console.log(`✅ shiftService: Se obtuvieron ${shiftsData.length} turnos`);

    // Verificar primer turno para debugging
    if (shiftsData.length > 0) {
      console.log('📊 Primer turno raw del backend:', shiftsData[0]);
    }

    const shifts = shiftsData.map(shift => {
      let start = null;
      let end = null;

      if (shift.start && shift.end) {
        start = shift.start;
        end = shift.end;
      } else if (shift.date) {
        const ensureSeconds = (t) => {
          if (!t) return null;
          if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
          if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
          const m = String(t).match(/(\d{2}:\d{2})/);
          return m ? `${m[1]}:00` : null;
        };

        const s = ensureSeconds(shift.start_time || shift.startTime || shift.start);
        const e = ensureSeconds(shift.end_time || shift.endTime || shift.end);
        start = (shift.date && s) ? `${shift.date}T${s}` : null;
        end = (shift.date && e) ? `${shift.date}T${e}` : null;
      }

      if (!start || !end) {
        console.warn('⚠️ Turno con start/end inválidos:', shift);
        return null;
      }

      const employeeName = shift.employee_name || 
        (shift.employee && shift.employee.user && 
         `${shift.employee.user.first_name || ''} ${shift.employee.user.last_name || ''}`.trim()) || 
        shift.employee || '';
      
      // ✅ Mapear role_in_shift correctamente
      const role = shift.role_in_shift || shift.role || '';
      
      // ✅ Mapear notes correctamente
      const notes = shift.notes || '';
      
      console.log(`📝 Turno ${shift.id} - Role: "${role}", Notes: "${notes}"`);
      
      const title = `${employeeName} - ${role || 'Sin rol'}`.trim();
      const color = shift.shift_type_color || 
        (shift.shift_type && (shift.shift_type.color || shift.shift_type.color_hex)) || 
        shift.color || null;
      
      const shiftTypeId = shift.shift_type?.id ?? 
        shift.shift_type ?? 
        shift.shift_type_id ?? 
        shift.shiftTypeId ?? null;

      return {
        id: shift.id,
        title,
        start,
        end,
        color,
        extendedProps: {
          employeeId: shift.employee ?? shift.employee_id ?? null,
          employeeName: employeeName || null,
          shiftTypeId,
          role: role,  // ✅ De role_in_shift
          notes: notes  // ✅ De notes
        }
      };
    }).filter(Boolean);

    console.log('✅ Turnos formateados:', shifts.length);
    if (shifts.length > 0) {
      console.log('📊 Primer turno formateado:', shifts[0]);
    }

    return shifts;
  } catch (error) {
    console.error('❌ shiftService: Error fetching shifts for calendar:', error);
    throw error;
  }
},

  // Obtener un turno específico
  getShift: async (shiftId) => {
    try {
      const response = await shiftAPI.getShift(shiftId);
      return response;
    } catch (error) {
      console.error('Error fetching shift:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener turno');
    }
  },

  // Actualizar turno
  updateShift: async (shiftId, shiftData) => {
  try {
    const padSeconds = (t) => {
      if (!t) return undefined;
      if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
      if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
      return t;
    };

    const payload = {
      date: shiftData.date,
      start_time: padSeconds(shiftData.start_time || shiftData.startTime),
      end_time: padSeconds(shiftData.end_time || shiftData.endTime),
      employee: parseInt(shiftData.employeeId || shiftData.employee),
      shift_type: parseInt(shiftData.shiftTypeId || shiftData.shift_type),
      notes: shiftData.notes || ''
    };

    console.log('🔄 [shiftService] Actualizando turno:', shiftId, payload);
    const response = await shiftAPI.updateShift(shiftId, payload);
    console.log('✅ [shiftService] Turno actualizado:', response);
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

  // Eliminar turno
  deleteShift: async (shiftId) => {
    try {
      const response = await shiftAPI.deleteShift(shiftId);
      return response;
    } catch (error) {
      console.error('Error deleting shift:', error);
      throw new Error(error.response?.data?.detail || 'Error al eliminar turno');
    }
  },

  // Duplicar turnos
  duplicateShifts: async (duplicateData) => {
  try {
    const payload = {
      start_date: duplicateData.sourceStartDate,
      end_date: duplicateData.sourceEndDate,
      target_start_date: duplicateData.targetStartDate
    };

    console.log('[shiftService] duplicateShifts - Payload:', payload);
    
    // Validar que las fechas existan
    if (!payload.start_date || !payload.end_date || !payload.target_start_date) {
      throw new Error('Las fechas de origen y destino son requeridas');
    }

    const response = await shiftAPI.duplicateShifts(payload);
    
    console.log('[shiftService] duplicateShifts - Response:', response);
    
    return response;
  } catch (error) {
    console.error('[shiftService] Error duplicating shifts:', error);
    console.error('[shiftService] Error response:', error.response?.data);
    throw new Error(error.response?.data?.error || error.response?.data?.detail || error.message || 'Error al duplicar turnos');
  }
},

  // Tipos de Turno
  getShiftTypes: async () => {
    try {
      console.log('🔄 shiftService: Obteniendo tipos de turno...');
      const response = await shiftAPI.getShiftTypes();
      
      // Validar que la respuesta sea un array
      if (!response) {
        console.warn('⚠️ shiftService: Respuesta vacía de getShiftTypes');
        return [];
      }
      
      const shiftTypes = Array.isArray(response) ? response : 
                        response.results || response.data || [];
      
      console.log(`✅ shiftService: Se obtuvieron ${shiftTypes.length} tipos de turno`);
      return shiftTypes;
    } catch (error) {
      console.error('❌ shiftService: Error fetching shift types:', error);
      throw error; // Re-lanzar el error original
    }
  },

  createShiftType: async (shiftTypeData) => {
  try {
    console.log('🔄 shiftService: Creando tipo de turno...', shiftTypeData);
    
    // Validar datos requeridos
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

    console.log('📤 Payload para crear tipo de turno:', payload);
    
    // ✅ CORREGIDO: Validación mejorada para turnos nocturnos
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (!timeRegex.test(payload.start_time) || !timeRegex.test(payload.end_time)) {
      throw new Error('Formato de hora inválido. Use HH:MM o HH:MM:SS');
    }

    // ✅ NUEVA LÓGICA: Detectar si es un turno nocturno (cruza medianoche)
    const isOvernightShift = isOvernight(payload.start_time, payload.end_time);
    
    if (!isOvernightShift) {
      // Para turnos normales (mismo día), validar que end > start
      const start = new Date(`1970-01-01T${payload.start_time}`);
      const end = new Date(`1970-01-01T${payload.end_time}`);
      if (start >= end) {
        throw new Error('La hora de fin debe ser mayor a la hora de inicio');
      }
    }
    // Para turnos nocturnos, no hacemos esta validación porque es normal que end < start

    console.log('🚀 Enviando request a la API...');
    const response = await shiftAPI.createShiftType(payload);
    console.log('✅ Tipo de turno creado exitosamente:', response);
    
    return response;
  } catch (error) {
    console.error('❌ shiftService: Error creating shift type:', error);
    console.error('❌ Error response:', error.response?.data);
    
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
      console.error('Error updating shift type:', error);
      throw new Error(error.response?.data?.detail || error.message || 'Error al actualizar tipo de turno');
    }
  },

  deleteShiftType: async (shiftTypeId) => {
    try {
      const response = await shiftAPI.deleteShiftType(shiftTypeId);
      return response;
    } catch (error) {
      console.error('Error deleting shift type:', error);
      throw new Error(error.response?.data?.detail || 'Error al eliminar tipo de turno');
    }
  },

  // Método auxiliar para obtener empleados (si no tienes un servicio separado)
  getEmployees: async () => {
    try {
      // Preferir un endpoint dedicado si existe
      const resp = await shiftAPI.getEmployees();
      if (resp) {
        // El backend puede devolver varias formas (array directo, {results: [...]}, {data: [...]})
        let data = Array.isArray(resp) ? resp : (resp.results || resp.data || resp.users || []);
        if (!Array.isArray(data)) {
          // intentar extraer primer array
          const firstArray = Object.values(resp).find(v => Array.isArray(v));
          data = firstArray || [];
        }

        // Normalizar a {id, name, position}
        return data.map(u => ({
          id: u.id ?? u.pk ?? u.user_id ?? u.employee_id ?? null,
          name: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username || u.email || 'Sin nombre',
          position: u.position || u.puesto || u.jobTitle || ''
        })).filter(e => e.id !== null);
      }

      // Si no hay un endpoint, intentar derivar de turnos (fallback)
      const response = await shiftAPI.getShifts();
      const employeesMap = new Map();
      const shiftsData = Array.isArray(response) ? response : (response.results || response.data || []);
      shiftsData.forEach(shift => {
        const empId = shift.employee ?? shift.employee_id ?? shift.employeeId ?? null;
        if (empId && !employeesMap.has(empId)) {
          employeesMap.set(empId, {
            id: empId,
            name: shift.employee_name || `${shift.employee?.user?.first_name || ''} ${shift.employee?.user?.last_name || ''}`.trim() || String(empId),
            position: shift.role || 'Sin especificar'
          });
        }
      });
      return Array.from(employeesMap.values());
    } catch {
      return [];
    }
  },

  getMyShifts: async (params = {}) => {
  try {
    console.log('🔄 [shiftService] Obteniendo mis turnos...');
    
    // CORREGIDO: Buscar 'token' en lugar de 'access_token'
    const token = localStorage.getItem('token');
    console.log('🔐 [shiftService] Token encontrado:', token ? 'Sí' : 'No');
    
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
  
  // En shiftService.js - getMyShiftsForCalendar
// En shiftService.js - getMyShiftsForCalendar
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
        // Construir fechas ISO
        const startISO = shift.start || (shift.date && shift.start_time ? `${shift.date}T${shift.start_time}` : null);
        const endISO = shift.end || (shift.date && shift.end_time ? `${shift.date}T${shift.end_time}` : null);
        
        if (!startISO || !endISO) {
          console.warn('⚠️ Turno sin start/end:', shift);
          return null;
        }
        
        // Convertir a objetos Date para FullCalendar
        const startDate = new Date(startISO);
        const endDate = new Date(endISO);
        
        // Validar que las fechas sean válidas
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.warn('⚠️ Fechas inválidas:', { startISO, endISO });
          return null;
        }
        
        const employeeName = shift.employee_name || '';
        const shiftTypeName = shift.shift_type_name || 'Turno';
        const role = shift.employee_position || shift.role || '';
        const notes = shift.notes || '';
        
        // ✅ USAR EL COLOR DE LA BASE DE DATOS
        const color = shift.shift_type_color;
        
        console.log(`✅ Turno ${shift.id} - Color desde BD:`, color);
        
        return {
          id: shift.id,
          title: role ? `${shiftTypeName} - ${role}` : shiftTypeName,
          start: startDate,
          end: endDate,
          role,
          location: shift.location || 'Sucursal Principal',
          department: shift.department || 'General',
          status: shift.status || 'confirmed',
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
            location: shift.location || 'Sucursal Principal',
            department: shift.department || 'General',
            status: shift.status || 'confirmed',
            color: color
          }
        };
      }).filter(Boolean);
      
      console.log('✅ Turnos formateados para calendario:', shifts.length);
      return shifts;
    } catch (error) {
      console.error('❌ [shiftService] Error fetching my shifts for calendar:', error);
      throw error;
    }
  },
};

export default shiftService;