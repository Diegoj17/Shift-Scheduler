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
      console.error('❌ [shiftChangeService] Error creando solicitud:', error);

      // Si el error fue un timeout/network abort, es posible que el backend haya procesado
      // la creación pero la respuesta no llegó al cliente. Intentar verificar si la
      // solicitud existe antes de reportar error al usuario.
      const isTimeout = error.code === 'ECONNABORTED' || (error.message && error.message.toLowerCase().includes('timeout'));
      if (isTimeout) {
        try {
          console.warn('⏱️ [shiftChangeService] Timeout al crear solicitud — verificando existencia en backend...');
          const results = await module.exports.getChangeRequests({ original_shift: requestData.originalShiftId });
          if (results && results.length > 0) {
            console.log('✅ [shiftChangeService] Verificación: solicitud encontrada tras timeout:', results[0]);
            return results[0];
          }
        } catch (verifyErr) {
          console.error('❌ [shiftChangeService] Error verificando existencia tras timeout:', verifyErr);
        }
      }

      // Manejo estándar de errores: intentar extraer mensaje del backend cuando sea posible
      const backendData = error.response?.data;
      const backendMessage = backendData?.detail || backendData?.message || null;
      throw new Error(backendMessage || 'Error al crear solicitud');
    }
  },

  /**
   * Obtener lista de solicitudes
   */
  getChangeRequests: async (filters = {}) => {
    try {
      console.log('🔄 [shiftChangeService] Obteniendo solicitudes con filtros:', filters);

      const params = new URLSearchParams();

      // Agregar cualquier filtro disponible dinámicamente
      Object.keys(filters).forEach(key => {
        const val = filters[key];
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          params.append(key, String(val));
        }
      });

      const query = params.toString() ? `?${params.toString()}` : '';
      const response = await shiftsApi.get(`/change-requests/${query}`);
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

      const doPut = async () => await shiftsApi.put(`/change-requests/${requestId}/review/`, payload);

      // Intentar la petición una vez, y reintentar si hay timeout / sin respuesta
      try {
        const response = await doPut();
        console.log('✅ [shiftChangeService] Solicitud revisada:', response.data);
        return response.data;
      } catch (err) {
        console.warn('⚠️ [shiftChangeService] Error en primer intento de review:', err?.code || err?.message || err);
        const isNetworkError = !err.response;
        const isTimeout = err.code === 'ECONNABORTED' || (err.message && err.message.toLowerCase().includes('timeout'));

        if (isNetworkError || isTimeout) {
          console.warn('⏱️ [shiftChangeService] Reintentando review por posible error de red...');
          try {
            await new Promise(res => setTimeout(res, 500));
            const retryResp = await doPut();
            console.log('✅ [shiftChangeService] Solicitud revisada en retry:', retryResp.data);
            return retryResp.data;
          } catch (retryErr) {
            console.error('❌ [shiftChangeService] Retry falló:', retryErr);
            // caer al manejo estándar abajo
            err = retryErr;
          }
        }

        // Si no fue un error de red o el retry falló, lanzar para manejo externo
        throw err;
      }
    } catch (error) {
      console.error('❌ [shiftChangeService] Error revisando solicitud:', error);

      // Si no hay respuesta del servidor, informar al usuario con un mensaje claro
      if (!error.response) {
        const msg = error.message || 'No se recibió respuesta del servidor. Revisa tu conexión e intenta nuevamente.';
        throw new Error(msg);
      }

      // Extraer mensaje del backend cuando esté disponible
      const backendData = error.response.data;
      const backendMsg = backendData?.detail || backendData?.manager_comment || backendData?.message || null;
      throw new Error(backendMsg || `Error ${error.response.status}: ${error.response.statusText}` || 'Error al revisar solicitud');
    }
  }
};

export default shiftChangeService;