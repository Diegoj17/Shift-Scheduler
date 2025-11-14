import { authApi } from '../api/Axios';

const authService = {
  login: async (email, password) => {
    try {
      const response = await authApi.post('/login/', { email, password });
      const { access, refresh, user } = response.data;
      
      localStorage.setItem('token', access);
      localStorage.setItem('refresh', refresh);
      
      return { token: access, refresh, user };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.detail || error.response?.data?.message || 'Error en el inicio de sesión');
    }
  },

  register: async (userData) => {
    try {
      const payload = {
        first_name: userData.first_name || userData.firstName || '',
        last_name: userData.last_name || userData.lastName || '',
        email: userData.email || '',
        telefono: userData.telefono || userData.phone || '',
        password: userData.password || '',
        password_confirm: userData.password_confirm || userData.passwordConfirm || '',
        role: userData.role || 'EMPLEADO'
      };

      const response = await authApi.post('/register/', payload);
      return response.data;
    } catch (error) {
      console.error('Register error:', error);
      throw new Error(error.response?.data?.detail || error.response?.data?.message || 'Error en el registro');
    }
  },

  getProfile: async () => {
    try {
      const response = await authApi.get('/me/');
      return response.data.user || response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener perfil');
    }
  },

  resetPassword: async (email) => {
    try {
      const response = await authApi.post('/password/reset/', { email });

      // Solo un status 2xx llega aquí (try block)
      const rawMsg = response.data?.message || response.data?.detail || '';
      const lower = String(rawMsg).toLowerCase();

      // Doble verificación: incluso en respuesta exitosa, revisar si dice "no existe"
      if (lower.includes('no existe') || lower.includes('no encontrado') || lower.includes('no registrado') || lower.includes('inexistente')) {
        throw new Error('No existe usuario con ese correo');
      }

      // Mensaje de éxito real
      const successMessage = rawMsg || 'Se ha enviado un enlace de recuperación a tu correo electrónico.';
      return { success: true, message: successMessage, data: response.data };

    } catch (error) {
      // Aquí llegan todos los errores (status 4xx, 5xx, errores de red, etc.)
      const remoteRaw = error.response?.data?.message || error.response?.data?.detail || '';
      const remoteMsg = String(remoteRaw).toLowerCase();

      // Rate limit
      if (error.response?.status === 429) {
        throw new Error('Ya solicitaste un restablecimiento recientemente. Espera una hora.');
      }

      // Usuario no existe (status 400, 404, etc.)
      if (remoteMsg && (remoteMsg.includes('no existe') || remoteMsg.includes('no encontrado') || remoteMsg.includes('no registrado') || remoteMsg.includes('inexistente') || remoteMsg.includes('not found') || remoteMsg.includes('does not exist'))) {
        throw new Error('No existe usuario con ese correo');
      }

      // Cualquier otro error del servidor con status 4xx o 5xx
      if (error.response?.status >= 400) {
        const errorMsg = remoteRaw || 'Error al enviar enlace de recuperación';
        throw new Error(String(errorMsg));
      }

      // Error de red u otro tipo
      throw new Error(error.message || 'Error al enviar enlace de recuperación');
    }
  },

  confirmPasswordReset: async (uidOrObj, token, newPassword) => {
    try {
      let payload;

      if (typeof uidOrObj === 'object' && uidOrObj !== null) {
        const o = uidOrObj;
        payload = {
          uid: o.uid || o.uidb64 || o.user_id || '',
          token: o.token,
          new_password: o.new_password || o.newPassword || o.password || '',
          new_password_confirm: o.new_password_confirm ?? o.newPasswordConfirm ?? o.password_confirm ?? o.passwordConfirm ?? (o.new_password || o.newPassword || '')
        };
      } else {
        payload = {
          uid: uidOrObj,
          token,
          new_password: newPassword,
          new_password_confirm: newPassword
        };
      }

      const response = await authApi.post('/password/reset/confirm/', payload);
      return response.data;
    } catch (error) {
      if (error.response?.status === 400) {
        throw new Error('El enlace es inválido o ha expirado. Solicita uno nuevo.');
      }
      throw new Error(error.response?.data?.message || 'Error al actualizar contraseña');
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await authApi.post('/password/change/', {
        current_password: currentPassword,
        new_password: newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      throw new Error(error.response?.data?.detail || 'Error al cambiar contraseña');
    }
  },

  updateProfile: async (userData) => {
    try {
      const response = await authApi.put('/profile/', userData);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw new Error(error.response?.data?.detail || 'Error al actualizar perfil');
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    window.location.href = '/login';
  },

  verifyToken: async (token) => {
    try {
      const response = await authApi.get('/me/', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.user || response.data;
    } catch (error) {
      console.error('Verify token error:', error);
      throw new Error('Token inválido o expirado');
    }
  },

  // Métodos adicionales para gestión de usuarios
  getUsers: async () => {
    try {
      const response = await authApi.get('/users/');
      return response.data;
    } catch (error) {
      console.error('Get users error:', error);
      throw new Error(error.response?.data?.detail || 'Error al obtener usuarios');
    }
  },

  createUser: async (userData) => {
    try {
      const response = await authApi.post('/users/create/', userData);
      return response.data;
    } catch (error) {
      console.error('Create user error:', error);
      throw new Error(error.response?.data?.detail || 'Error al crear usuario');
    }
  },

  updateUser: async (userId, userData) => {
    try {
      const response = await authApi.put(`/users/${userId}/update/`, userData);
      return response.data;
    } catch (error) {
      console.error('Update user error:', error);
      throw new Error(error.response?.data?.detail || 'Error al actualizar usuario');
    }
  },

  deleteUser: async (userId) => {
    try {
      const response = await authApi.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Delete user error:', error);
      throw new Error(error.response?.data?.detail || 'Error al eliminar usuario');
    }
  },

  updateUserStatus: async (userId, status) => {
    try {
      const response = await authApi.patch(`/users/${userId}`, { status });
      return response.data;
    } catch (error) {
      console.error('Update user status error:', error);
      throw new Error(error.response?.data?.detail || 'Error al actualizar estado');
    }
  }
};

export default authService;