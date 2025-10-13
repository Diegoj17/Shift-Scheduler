import React, { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import authService from '../services/AuthService';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verificar autenticación al cargar la aplicación
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const user = await authService.verifyToken(token);
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Error verifying token:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Función para actualizar el usuario
  const updateUser = (userData) => {
    setCurrentUser(prevUser => ({
      ...prevUser,
      ...userData
    }));
  };

  // Función para hacer logout
  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('token');
  };

  const value = {
    currentUser,
    setCurrentUser,
    updateUser,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};