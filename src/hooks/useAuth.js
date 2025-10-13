import { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import AuthService from '../services/AuthService';

export const useAuth = () => {
  const { currentUser, setCurrentUser, updateUser, logout: contextLogout, loading: contextLoading } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await AuthService.login(email, password);
      setCurrentUser(response.user);
      setLoading(false);
      return { success: true, data: response };
    } catch (err) {
      console.error('Login error:', err);
      
      let errorMessage = 'Error al iniciar sesión';
      
      if (err.response?.status === 401) {
        errorMessage = 'Credenciales inválidas';
      } else if (err.response?.status === 403) {
        errorMessage = 'Usuario bloqueado o inactivo';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError(errorMessage);
      setLoading(false);
      return { success: false, message: errorMessage };
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await AuthService.register(userData);
      setLoading(false);
      return { success: true, data: response };
    } catch (err) {
      console.error('Register error:', err);
      
      let errorMessage = 'Error al registrar usuario';
      
      if (err.response?.status === 400) {
        if (err.response.data.email) {
          errorMessage = err.response.data.email[0];
        } else if (err.response.data.password_confirm) {
          errorMessage = err.response.data.password_confirm;
        } else if (err.response.data.password) {
          errorMessage = err.response.data.password[0];
        }
      }
      
      setError(errorMessage);
      setLoading(false);
      return { success: false, message: errorMessage };
    }
  };

  const resetPassword = async (email) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await AuthService.resetPassword(email);
      setLoading(false);
      return { success: true, data: response };
    } catch (err) {
      console.error('Reset password error:', err);
      
      let errorMessage = 'Error al restablecer contraseña';
      
      if (err.response?.status === 400) {
        errorMessage = err.response.data.email?.[0] || err.response.data.message;
      } else if (err.response?.status === 429) {
        errorMessage = 'Ya solicitaste un restablecimiento recientemente. Intenta más tarde.';
      }
      
      setError(errorMessage);
      setLoading(false);
      return { success: false, message: errorMessage };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await AuthService.changePassword(currentPassword, newPassword);
      setLoading(false);
      return { success: true, data: response };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al cambiar contraseña';
      setError(errorMessage);
      setLoading(false);
      return { success: false, message: errorMessage };
    }
  };

  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await AuthService.updateProfile(userData);
      updateUser(response.user);
      setLoading(false);
      return { success: true, data: response };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Error al actualizar perfil';
      setError(errorMessage);
      setLoading(false);
      return { success: false, message: errorMessage };
    }
  };

  const hasRole = (requiredRole) => {
    if (!currentUser || !currentUser.role) return false;
    return currentUser.role === requiredRole;
  };

  const hasAnyRole = (requiredRoles) => {
    if (!currentUser || !currentUser.role) return false;
    return requiredRoles.includes(currentUser.role);
  };

  const clearError = () => {
    setError(null);
  };

  return {
    currentUser,
    loading: loading || contextLoading,
    error,
    login,
    register,
    logout: contextLogout,
    resetPassword,
    changePassword,
    updateProfile,
    hasRole,
    hasAnyRole,
    clearError,
    isAuthenticated: !!currentUser
  };
};