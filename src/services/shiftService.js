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

export const shiftService = {
  // Crear un nuevo turno
  createShift: async (shiftData) => {
    let payload;

    try {
      // Debug: mostrar el objeto recibido desde el frontend antes de mapear
      if (import.meta?.env?.DEV) {
        console.debug && console.debug('[shiftService] received shiftData:', shiftData);
      }
      // Mapeo específico para el backend Django
  payload = {
        date: shiftData.date || shiftData.start?.split('T')[0],
        start_time: padSeconds(shiftData.start_time || shiftData.startTime || shiftData.start?.split('T')[1]?.substring(0, 5)),
        end_time: padSeconds(shiftData.end_time || shiftData.endTime || shiftData.end?.split('T')[1]?.substring(0, 5)),
  employee: Number(shiftData.employee_id || shiftData.employeeId || shiftData.employee),
  shift_type: Number(shiftData.shift_type_id || shiftData.shiftTypeId || shiftData.shiftType),
        notes: shiftData.notes || ''
      };

      // Validación requerida
      if (!payload.employee) throw new Error('employee is required');
      if (!payload.date) throw new Error('date is required');
      if (!payload.start_time) throw new Error('start_time is required');
      if (!payload.end_time) throw new Error('end_time is required');

  console.log('[shiftService] creating shift payload:', payload);
      
      // Usar shiftAPI en lugar de api directamente
      const response = await shiftAPI.createShift(payload);
      return response;
    } catch (error) {
      console.error('Error creating shift:', error);

      // Loguear el body de la respuesta (si existe) para facilitar diagnóstico
      console.error('Error response data:', error.response?.data);

      // Intento inteligente: si el backend rechaza por 'employee' (p.ej. enviaste User.id en lugar de Employee.id),
      // intentar mapear usando el endpoint de empleados y reintentar una vez.
      try {
        const data = error.response?.data;
        const lower = JSON.stringify(data || '').toLowerCase();
        const isEmployeeError = data && (data.employee || lower.includes('emplead') || lower.includes('employee'));

        if (isEmployeeError && payload && payload.employee) {
          console.log('[shiftService] Detectado error de employee, intentando resolver Employee.pk a partir de listado de empleados...');

          const all = await shiftAPI.getEmployees();
          let candidates = Array.isArray(all) ? all : (all?.results || all?.data || all?.employees || []);

          // Tratar de encontrar una correspondencia por user id u otros campos comunes
          const originalUserId = Number(payload.employee);
          const matched = candidates.find(c => {
            // varias formas posibles de representar el link entre Employee y User
            // si c.user es un objeto con id
            if (c.user && typeof c.user === 'object' && (c.user.id || c.user.pk)) {
              const uid = Number(c.user.id ?? c.user.pk);
              if (!Number.isNaN(uid) && uid === originalUserId) return true;
            }
            // si el empleado tiene user_id/employee_id
            if (c.user_id && Number(c.user_id) === originalUserId) return true;
            if (c.employee_id && Number(c.employee_id) === originalUserId) return true;
            // si el listado es en realidad users, comparar id directo
            if (c.id && Number(c.id) === originalUserId) return true;
            return false;
          });

          if (matched) {
            const newEmployeeId = matched.id ?? matched.pk ?? matched.employee_id ?? matched.user_id;
            if (newEmployeeId && Number(newEmployeeId) !== originalUserId) {
              console.log('[shiftService] Mapeo encontrado. Reintentando creación con employee =', newEmployeeId);
              const newPayload = { ...payload, employee: Number(newEmployeeId) };
              const retryResp = await shiftAPI.createShift(newPayload);
              return retryResp;
            }
          } else {
            console.warn('[shiftService] No se encontró correspondencia entre User.id y Employee.pk en el listado de empleados');
          }
        }
      } catch (retryErr) {
        console.warn('[shiftService] Reintento para resolver employee falló:', retryErr);
        // seguir con el manejo normal del error más abajo
      }

      const data = error.response?.data;
      // Si el backend devuelve errores de validación en forma de objeto, unirlos en un mensaje legible
      if (data && typeof data === 'object') {
        try {
          const parts = [];
          Object.keys(data).forEach(key => {
            const val = data[key];
            if (Array.isArray(val)) {
              parts.push(`${key}: ${val.join(' ')}`);
            } else if (typeof val === 'string') {
              parts.push(`${key}: ${val}`);
            } else if (typeof val === 'object') {
              parts.push(`${key}: ${JSON.stringify(val)}`);
            }
          });
          const composed = parts.join(' | ');
          throw new Error(composed || error.message || 'Error al crear turno');
        } catch {
          throw new Error(error.message || 'Error al crear turno');
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

      // Validar respuesta
      if (!response) {
        console.warn('⚠️ shiftService: Respuesta vacía de getShifts');
        return [];
      }

      const shiftsData = Array.isArray(response) ? response : (response.results || response.data || []);

      console.log(`✅ shiftService: Se obtuvieron ${shiftsData.length} turnos`);

      // Transformar datos para FullCalendar (soportar dos shapes: {date,start_time,end_time} o {start,end})
      const shifts = shiftsData.map(shift => {
        // Si viene el formato combinado ISO (start/end), usarlo directamente
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
          console.warn('⚠️ Turno con start/end inválidos o incompletos:', shift);
          return null;
        }

        const employeeName = shift.employee_name || (shift.employee && shift.employee.user && `${shift.employee.user.first_name || ''} ${shift.employee.user.last_name || ''}`.trim()) || shift.employee || '';
        const title = `${employeeName} - ${shift.role || 'Sin rol'}`.trim();

        const color = shift.shift_type_color || (shift.shift_type && (shift.shift_type.color || shift.shift_type.color_hex)) || shift.color || null;

        const shiftTypeId = shift.shift_type?.id ?? shift.shift_type ?? shift.shift_type_id ?? shift.shiftTypeId ?? null;

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
            role: shift.role || null,
            notes: shift.notes || null
          }
        };
      }).filter(Boolean);

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
      const payload = {
        date: shiftData.date,
        start_time: padSeconds(shiftData.start_time || shiftData.startTime || shiftData.start?.split('T')[1]?.substring(0,5)),
        end_time: padSeconds(shiftData.end_time || shiftData.endTime || shiftData.end?.split('T')[1]?.substring(0,5)),
        employee: shiftData.employee,
        shift_type: shiftData.shift_type,
        role: shiftData.role,
        notes: shiftData.notes
      };

      console.debug('[shiftService] updating shift:', payload);
      const response = await shiftAPI.updateShift(shiftId, payload);
      return response;
    } catch (error) {
      console.error('Error updating shift:', error);
      throw new Error(error.response?.data?.detail || error.message || 'Error al actualizar turno');
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

  console.log('[shiftService] duplicating shifts payload:', payload);
      const response = await shiftAPI.duplicateShifts(payload);
      return response;
    } catch (error) {
      console.error('Error duplicating shifts:', error);
      throw new Error(error.response?.data?.detail || error.message || 'Error al duplicar turnos');
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
      if (!shiftTypeData.name || !shiftTypeData.start_time || !shiftTypeData.end_time) {
        throw new Error('Faltan datos requeridos: name, start_time, end_time');
      }

      const payload = {
        name: shiftTypeData.name,
        start_time: padSeconds(shiftTypeData.start_time),
        end_time: padSeconds(shiftTypeData.end_time),
        color: shiftTypeData.color 
      };

      console.log('📤 Payload para crear tipo de turno:', payload);
      
      const response = await shiftAPI.createShiftType(payload);
      console.log('✅ Tipo de turno creado exitosamente:', response);
      
      return response;
    } catch (error) {
      console.error('❌ shiftService: Error creating shift type:', error);
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
    } catch (error) {
      console.error('Error fetching employees from shifts:', error);
      return [];
    }
  }
};

export default shiftService;