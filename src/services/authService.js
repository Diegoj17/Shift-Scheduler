import api from '../api/Axios';

const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/login/', { email, password });
      const { access, refresh, user } = response.data;
      
      localStorage.setItem('token', access);
      localStorage.setItem('refresh', refresh);
      
      return { token: access, refresh, user };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
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

      const response = await api.post('/register/', payload);
      return response.data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get('/me/');
      return response.data.user || response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  },

  resetPassword: async (email) => {
    try {
      const response = await api.post('/password/reset/', { email });
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.post('/change-password/', {
        current_password: currentPassword,
        new_password: newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },

  updateProfile: async (userData) => {
    try {
      const response = await api.put('/profile/', userData);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh');
    window.location.href = '/login';
  },

  verifyToken: async (token) => {
    try {
      // Intenta obtener el perfil con el token
      const response = await api.get('/me/', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.user || response.data;
    } catch (error) {
      console.error('Verify token error:', error);
      throw error;
    }
  },

};

export default authService;