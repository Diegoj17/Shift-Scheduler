import React, { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar usuario desde token al iniciar
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const user = await authService.verifyToken(token);
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Error al verificar token:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login
  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      setCurrentUser(response.user);
      return { success: true, data: response };
    } catch (error) {
      console.error('Error en login:', error);
      
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.response?.status === 401) {
        errorMessage = 'Credenciales inválidas';
      } else if (error.response?.status === 403) {
        errorMessage = 'Usuario bloqueado o inactivo';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      return { success: false, message: errorMessage };
    }
  };

  // Logout
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('token');
  };

  // Actualizar perfil
  const updateProfile = async (profileData) => {
    try {
      // Mapear campos del frontend al formato del backend
      const backendData = {
        first_name: profileData.firstName || profileData.first_name,
        last_name: profileData.lastName || profileData.last_name,
        telefono: profileData.phone || profileData.telefono,
        email: profileData.email
      };

      const response = await authService.updateProfile(backendData);
      
      // Actualizar usuario en el contexto
      setCurrentUser(response.user);
      
      return { success: true, data: response };
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      const errorMessage = error.response?.data?.message || 'Error al actualizar perfil';
      return { success: false, message: errorMessage };
    }
  };

  // Cambiar contraseña
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await authService.changePassword(currentPassword, newPassword);
      return { success: true, data: response };
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      const errorMessage = error.response?.data?.message || 'Error al cambiar contraseña';
      return { success: false, message: errorMessage };
    }
  };

  // Verificar rol
  const hasRole = (requiredRole) => {
    if (!currentUser || !currentUser.role) return false;
    return currentUser.role === requiredRole;
  };

  // Verificar si tiene alguno de los roles
  const hasAnyRole = (requiredRoles) => {
    if (!currentUser || !currentUser.role) return false;
    return requiredRoles.includes(currentUser.role);
  };

  const value = {
    currentUser,
    user: currentUser, // Alias para compatibilidad
    loading,
    login,
    logout,
    updateProfile,
    changePassword,
    hasRole,
    hasAnyRole,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export { AuthContext };