import api from './api';

export const authService = {
  login: async (email, password) => {
    // Endpoint: /api/auth/login
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (userData) => {
    // Endpoint expects: first_name, last_name, email, telefono, password, password_confirm, role
    const payload = {
      first_name: userData.first_name || userData.firstName || userData.first || '',
      last_name: userData.last_name || userData.lastName || userData.last || '',
      email: userData.email || '',
      telefono: userData.telefono || userData.phone || '',
      password: userData.password || '',
      password_confirm: userData.password_confirm || userData.passwordConfirm || userData.confirmPassword || '',
      role: userData.role || ''
    };

    const response = await api.post('/auth/register', payload);
    return response.data;
  },

  verifyToken: async (token) => {
    const response = await api.get('/auth/verify', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  resetPassword: async (email) => {
    const response = await api.post('/auth/reset-password', { email });
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put('/auth/profile', userData);
    return response.data;
  }
};