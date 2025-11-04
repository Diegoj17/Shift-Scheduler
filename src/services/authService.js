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
      return response.data;
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('Ya solicitaste un restablecimiento recientemente. Espera una hora.');
      }
      throw new Error(error.response?.data?.message || 'Error al enviar enlace de recuperación');
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
      const response = await authApi.post('/change-password/', {
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