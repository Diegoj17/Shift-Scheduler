import { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import authService from '../services/authService';

export const useAuth = () => {
  const { currentUser, setCurrentUser, updateUser, logout: contextLogout, loading: contextLoading } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(email, password);
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
      const response = await authService.register(userData);
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
    const response = await authService.resetPassword(email);
    setLoading(false);
    
    // 🔽 CORRECCIÓN: Verificar si la respuesta indica éxito real
    // Django puede responder con status 200 pero con mensaje de error
    if (response.message && (
        response.message.toLowerCase().includes('enviado') ||
        response.message.toLowerCase().includes('enlace') ||
        response.message.toLowerCase().includes('correo')
    )) {
      return { success: true, data: response };
    } else {
      // Si no es un mensaje de éxito, tratarlo como error
      return { success: false, message: response.message || 'No se pudo enviar el enlace' };
    }
    
  } catch (err) {
    console.error('Reset password error:', err);
    
    let errorMessage = 'Error al restablecer contraseña';
    
    if (err.message === 'No existe usuario con ese correo') {
      errorMessage = 'No existe usuario con ese correo';
    } else if (err.response?.status === 400) {
      errorMessage = err.response.data.email?.[0] || err.response.data.message;
    } else if (err.response?.status === 429) {
      errorMessage = 'Ya solicitaste un restablecimiento recientemente. Intenta más tarde.';
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    setError(errorMessage);
    setLoading(false);
    return { success: false, message: errorMessage };
  }
};

  // confirmPasswordReset: acepta dos formas de entrada:
  //  - un objeto { uid, token, new_password } (lo que usa ResetConfirmForm actualmente)
  //  - tres argumentos (uid, token, newPassword)
  const confirmPasswordReset = async (dataOrUid, maybeToken, maybeNewPassword) => {
    setLoading(true);
    setError(null);

    try {
      let uid, token, newPassword;

      if (typeof dataOrUid === 'object' && dataOrUid !== null && maybeToken === undefined && maybeNewPassword === undefined) {
        // Recibimos un objeto: pasar entero al servicio para mantener new_password_confirm si existe
        const response = await authService.confirmPasswordReset(dataOrUid);
        setLoading(false);
        return { success: true, data: response };
      } else {
        // Recibimos parámetros separados
        uid = dataOrUid;
        token = maybeToken;
        newPassword = maybeNewPassword;

        const response = await authService.confirmPasswordReset(uid, token, newPassword);
        setLoading(false);
        return { success: true, data: response };
  }
    } catch (err) {
      let errorMessage = 'Error al confirmar el restablecimiento de contraseña';

      if (err.response?.status === 400) {
        // Manejar errores de validación del backend
        if (err.response.data.new_password_confirm) {
          errorMessage = err.response.data.new_password_confirm[0];
        } else if (err.response.data.new_password) {
          errorMessage = err.response.data.new_password[0];
        } else if (err.response.data.token) {
          errorMessage = 'El enlace ha expirado o es inválido. Solicita uno nuevo.';
        } else if (err.response.data.uid) {
          errorMessage = 'Enlace de recuperación inválido.';
        } else if (err.response.data.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.response?.status === 404) {
        errorMessage = 'El enlace de recuperación no es válido o ha expirado.';
      }

      setError(errorMessage);
      setLoading(false);
      return { success: false, message: errorMessage };
    }
  };


  const updateProfile = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.updateProfile(userData);
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
    confirmPasswordReset,
    updateProfile,
    hasRole,
    hasAnyRole,
    clearError,
    isAuthenticated: !!currentUser
  };
};