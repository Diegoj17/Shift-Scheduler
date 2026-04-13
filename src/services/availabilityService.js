// services/availabilityService.js
import { shiftAPI } from '../api/Axios';

// Helper: asegura formato HH:MM:SS para horas
const padSeconds = (t) => {
  if (!t) return undefined;
  if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
  if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
  const match = String(t).match(/(\d{2}:\d{2})/);
  if (match) return `${match[1]}:00`;
  return undefined;
};

// Helper: detecta si un rango cruza medianoche
const isOvernight = (startTime, endTime) => {
  if (!startTime || !endTime) return false;
  const start = new Date(`1970-01-01T${startTime}`);
  const end = new Date(`1970-01-01T${endTime}`);
  return end < start;
};

// Colores para disponibilidad
export const AVAILABILITY_COLORS = {
  AVAILABLE: '#22543d',      // Verde - Disponible
  UNAVAILABLE: '#742a2a'     // Rojo - No disponible
};

export const availabilityService = {
  /**
   * Crear nueva disponibilidad
   * Solo EMPLEADOS pueden crear
   */
  createAvailability: async (availabilityData) => {
    try {
      
      // Validaciones
      if (!availabilityData.date) {
        throw new Error('La fecha es requerida');
      }
      if (!availabilityData.start_time && !availabilityData.startTime) {
        throw new Error('La hora de inicio es requerida');
      }
      if (!availabilityData.end_time && !availabilityData.endTime) {
        throw new Error('La hora de fin es requerida');
      }
      if (!availabilityData.type || !['available', 'unavailable'].includes(availabilityData.type)) {
        throw new Error('El tipo debe ser "available" o "unavailable"');
      }

      const payload = {
        date: availabilityData.date,
        start_time: padSeconds(availabilityData.start_time || availabilityData.startTime),
        end_time: padSeconds(availabilityData.end_time || availabilityData.endTime),
        type: availabilityData.type,
        notes: availabilityData.notes || ''
      };

      
      const response = await shiftAPI.createAvailability(payload);
      
      return response;
    } catch (error) {
      console.error('[availabilityService] Error creating availability:', error);
      console.error('[availabilityService] Error response data:', error.response?.data);
      
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
      
      throw new Error(error.response?.data?.detail || error.message || 'Error al crear disponibilidad');
    }
  },

  /**
   * Obtener disponibilidades
   * Empleados: solo ven las suyas
   * Gerentes/Admin: ven todas con filtros
   */
  getAvailabilities: async (params = {}) => {
    try {
      
      const response = await shiftAPI.getAvailabilities(params);
      
      if (!response) {
        console.warn('⚠️ availabilityService: Respuesta vacía de getAvailabilities');
        return [];
      }

      const availabilities = Array.isArray(response) ? response : (response.results || response.data || []);
      
      return availabilities;
    } catch (error) {
      console.error('❌ availabilityService: Error fetching availabilities:', error);
      throw new Error(error.response?.data?.detail || error.message || 'Error al obtener disponibilidades');
    }
  },

  /**
   * Obtener disponibilidades para FullCalendar
   * Formatea las disponibilidades para ser mostradas en el calendario
   */
  getAvailabilitiesForCalendar: async (params = {}) => {
    try {
      
      const availabilitiesData = await availabilityService.getAvailabilities(params);
      
      if (!Array.isArray(availabilitiesData) || availabilitiesData.length === 0) {
        return [];
      }


      const availabilities = availabilitiesData.map(avail => {
        // Construir fechas ISO
        let start = null;
        let end = null;

        if (avail.date && avail.start_time && avail.end_time) {
          const ensureSeconds = (t) => {
            if (!t) return null;
            if (/^\d{2}:\d{2}:\d{2}$/.test(t)) return t;
            if (/^\d{2}:\d{2}$/.test(t)) return `${t}:00`;
            const m = String(t).match(/(\d{2}:\d{2})/);
            return m ? `${m[1]}:00` : null;
          };

          const s = ensureSeconds(avail.start_time);
          const e = ensureSeconds(avail.end_time);
          start = `${avail.date}T${s}`;
          end = `${avail.date}T${e}`;
        }

        if (!start || !end) {
          console.warn('⚠️ Disponibilidad con start/end inválidos:', avail);
          return null;
        }

        // Determinar color según el tipo
        const color = avail.type === 'available' 
          ? AVAILABILITY_COLORS.AVAILABLE 
          : AVAILABILITY_COLORS.UNAVAILABLE;

        // Título descriptivo
        const typeLabel = avail.type === 'available' ? '✓ Disponible' : '✕ No Disponible';
        const employeeName = avail.employee_name || 'Empleado';
        const title = `${employeeName} - ${typeLabel}`;

        return {
          id: `avail-${avail.id}`, // Prefijo para diferenciar de turnos
          title,
          start,
          end,
          backgroundColor: color,
          borderColor: color,
          textColor: 'white',
          extendedProps: {
            availabilityId: avail.id,
            employeeId: avail.employee_id,
            employeeName: avail.employee_name,
            employeePosition: avail.employee_position,
            employeeArea: avail.employee_area,
            type: avail.type,
            notes: avail.notes || '',
            durationHours: avail.duration_hours,
            color: color,
            isAvailability: true // Flag para identificar que es disponibilidad
          }
        };
      }).filter(Boolean);

      if (availabilities.length > 0) {
      }

      return availabilities;
    } catch (error) {
      console.error('❌ availabilityService: Error fetching availabilities for calendar:', error);
      throw error;
    }
  },

  /**
   * Actualizar disponibilidad
   * Solo el empleado dueño puede actualizar
   */
  updateAvailability: async (availabilityId, availabilityData) => {
    try {

      const payload = {
        date: availabilityData.date,
        start_time: padSeconds(availabilityData.start_time || availabilityData.startTime),
        end_time: padSeconds(availabilityData.end_time || availabilityData.endTime),
        type: availabilityData.type,
        notes: availabilityData.notes || ''
      };

      
      const response = await shiftAPI.updateAvailability(availabilityId, payload);
      
      return response;
    } catch (error) {
      console.error('❌ [availabilityService] Error updating availability:', error.response?.data);
      
      const errorMsg = error.response?.data?.detail || 
                       error.response?.data?.conflict || 
                       error.message || 
                       'Error al actualizar disponibilidad';
      throw new Error(errorMsg);
    }
  },

  /**
   * Eliminar disponibilidad
   * Solo el empleado dueño puede eliminar
   */
  deleteAvailability: async (availabilityId) => {
    try {
      
      const response = await shiftAPI.deleteAvailability(availabilityId);
      
      return response;
    } catch (error) {
      console.error('[availabilityService] Error deleting availability:', error);
      throw new Error(error.response?.data?.detail || error.message || 'Error al eliminar disponibilidad');
    }
  },

  /**
   * Verificar si un empleado está disponible en un horario específico
   * Gerentes/Admin pueden verificar cualquier empleado
   * Empleados solo pueden verificar su propia disponibilidad
   */
  checkEmployeeAvailability: async (checkData) => {
    try {

      if (!checkData.employee) {
        throw new Error('El ID del empleado es requerido');
      }
      if (!checkData.date) {
        throw new Error('La fecha es requerida');
      }
      if (!checkData.start_time && !checkData.startTime) {
        throw new Error('La hora de inicio es requerida');
      }
      if (!checkData.end_time && !checkData.endTime) {
        throw new Error('La hora de fin es requerida');
      }

      const payload = {
        employee: parseInt(checkData.employee),
        date: checkData.date,
        start_time: padSeconds(checkData.start_time || checkData.startTime),
        end_time: padSeconds(checkData.end_time || checkData.endTime)
      };


      const response = await shiftAPI.checkEmployeeAvailability(payload);
      
      
      return response;
    } catch (error) {
      console.error('[availabilityService] Error checking availability:', error);
      throw new Error(error.response?.data?.detail || error.response?.data?.error || error.message || 'Error al verificar disponibilidad');
    }
  },

  /**
   * Obtener estadísticas de disponibilidad
   * Útil para dashboards y reportes
   */
  getAvailabilityStats: async (params = {}) => {
    try {
      const availabilities = await availabilityService.getAvailabilities(params);
      
      const stats = {
        total: availabilities.length,
        available: availabilities.filter(a => a.type === 'available').length,
        unavailable: availabilities.filter(a => a.type === 'unavailable').length,
        totalHoursAvailable: availabilities
          .filter(a => a.type === 'available')
          .reduce((sum, a) => sum + (a.duration_hours || 0), 0),
        totalHoursUnavailable: availabilities
          .filter(a => a.type === 'unavailable')
          .reduce((sum, a) => sum + (a.duration_hours || 0), 0),
        employeesWithAvailability: new Set(availabilities.map(a => a.employee_id)).size
      };

      return stats;
    } catch (error) {
      console.error('❌ Error getting availability stats:', error);
      return {
        total: 0,
        available: 0,
        unavailable: 0,
        totalHoursAvailable: 0,
        totalHoursUnavailable: 0,
        employeesWithAvailability: 0
      };
    }
  }
};

export default availabilityService;
