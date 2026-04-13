import { shiftsApi } from '../api/Axios';

/**
 * Obtiene la fecha local en formato YYYY-MM-DD
 */
const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const timeEntryService = {
  /**
   * Obtener el último registro del empleado autenticado
   */
  getLastEntry: async () => {
    try {
      const response = await shiftsApi.get('/time-entry/last/');
      return response.data;
    } catch (error) {
      console.error('❌ [timeEntryService] Error obteniendo último registro:', error);
      throw error;
    }
  },

  /**
   * Registrar entrada o salida
   */
  createTimeEntry: async (entryType, notes = '', location = '', shiftId = null) => {
    try {
      
      const payload = {
        entry_type: entryType,
        notes: notes || '',
        location: location || ''
      };

      if (shiftId) {
        payload.shift_id = shiftId;
      }

      const response = await shiftsApi.post('/time-entry/new/', payload);
      return response.data;
    } catch (error) {
      console.error('❌ [timeEntryService] Error creando registro:', error);
      console.error('❌ Error response:', error.response?.data);
      
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      
      throw error;
    }
  },

  /**
   * Obtener historial de registros
   */
  getMyTimeEntries: async (filters = {}) => {
    try {
      
      const params = new URLSearchParams();
      
      if (filters.start_date) {
        params.append('start_date', filters.start_date);
      }
      if (filters.end_date) {
        params.append('end_date', filters.end_date);
      }
      if (filters.entry_type) {
        params.append('entry_type', filters.entry_type);
      }
      // Permitir filtro por employee_id cuando backend lo soporte (reporte admin)
      if (filters.employee_id) {
        params.append('employee_id', filters.employee_id);
      }

      const response = await shiftsApi.get(`/time-entry/?${params.toString()}`);
      return response.data.results || [];
    } catch (error) {
      console.error('❌ [timeEntryService] Error obteniendo historial:', error);
      return [];
    }
  },

  /**
   * Obtener registros de hoy agrupados
   */
  getTodayEntries: async () => {
    try {
      const today = getLocalDateString(); // ✅ Usar fecha local
      const entries = await timeEntryService.getMyTimeEntries({
        start_date: today,
        end_date: today
      });

      const check_in = entries.find(e => e.entry_type === 'check_in');
      const check_out = entries.find(e => e.entry_type === 'check_out');

      return { check_in, check_out };
    } catch (error) {
      console.error('❌ [timeEntryService] Error obteniendo registros de hoy:', error);
      return { check_in: null, check_out: null };
    }
  },

  /**
   * Calcular horas trabajadas
   */
  calculateHours: (checkInTime, checkOutTime) => {
    try {
      const start = new Date(checkInTime);
      const end = new Date(checkOutTime);
      const diffMs = end - start;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffHours > 0 && diffMinutes > 0) {
        return `${diffHours}h ${diffMinutes}m`;
      } else if (diffHours > 0) {
        return `${diffHours}h`;
      } else {
        return `${diffMinutes}m`;
      }
    } catch (error) {
      return '-';
    }
  }
};

export default timeEntryService;
