import { shiftsApi } from '../api/Axios';

export const shiftChangeService = {
  /**
   * Crear solicitud de cambio de turno (EMPLEADO)
   */
  createChangeRequest: async (requestData) => {
    try {
      console.log('🔄 [shiftChangeService] Creando solicitud:', requestData);
      
      const payload = {
        original_shift: requestData.originalShiftId,
        proposed_employee: requestData.proposedEmployeeId || null,
        proposed_shift: requestData.proposedShiftId || null,
        reason: requestData.reason
      };

      const response = await shiftsApi.post('/change-requests/new/', payload);
      console.log('✅ [shiftChangeService] Solicitud creada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [shiftChangeService] Error creando solicitud:', error.response?.data);
      throw new Error(error.response?.data?.detail || 'Error al crear solicitud');
    }
  },

  /**
   * Obtener lista de solicitudes
   */
  getChangeRequests: async (filters = {}) => {
    try {
      console.log('🔄 [shiftChangeService] Obteniendo solicitudes con filtros:', filters);
      
      const params = new URLSearchParams();
      
      if (filters.status) {
        params.append('status', filters.status);
      }

      const response = await shiftsApi.get(`/change-requests/?${params.toString()}`);
      console.log('✅ [shiftChangeService] Solicitudes obtenidas:', response.data);
      return response.data.results || [];
    } catch (error) {
      console.error('❌ [shiftChangeService] Error obteniendo solicitudes:', error);
      return [];
    }
  },

  /**
   * Aprobar o rechazar solicitud (GERENTE)
   */
  reviewChangeRequest: async (requestId, action, comment = '') => {
    try {
      console.log('🔄 [shiftChangeService] Revisando solicitud:', { requestId, action, comment });
      
      const payload = {
        action, // 'approve' o 'reject'
        manager_comment: comment
      };

      const response = await shiftsApi.put(`/change-requests/${requestId}/review/`, payload);
      console.log('✅ [shiftChangeService] Solicitud revisada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ [shiftChangeService] Error revisando solicitud:', error.response?.data);
      throw new Error(error.response?.data?.detail || error.response?.data?.manager_comment || 'Error al revisar solicitud');
    }
  }
};

export default shiftChangeService;