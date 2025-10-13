import api from '../api/Axios';

const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    // El backend devuelve { access, refresh, user }
    const { access, user } = response.data;
    
    // Guardar token en localStorage
    localStorage.setItem('token', access);
    
    return {
      token: access,
      user: user
    };
  },

  register: async (userData) => {
    const payload = {
      first_name: userData.first_name || userData.firstName || userData.first || '',
      last_name: userData.last_name || userData.lastName || userData.last || '',
      email: userData.email || '',
      telefono: userData.telefono || userData.phone || '',
      password: userData.password || '',
      password_confirm: userData.password_confirm || userData.passwordConfirm || userData.confirmPassword || '',
      role: userData.role || 'EMPLEADO'
    };

    const response = await api.post('/auth/register', payload);
    return response.data;
  },

  verifyToken: async (token) => {
    const response = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.user; // El backend devuelve { user }
  },

  resetPassword: async (email) => {
    const response = await api.post('/auth/password/reset', { email });
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

export default authService;
export { authService };
