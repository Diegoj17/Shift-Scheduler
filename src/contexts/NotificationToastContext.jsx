import React, { createContext, useContext, useState, useCallback } from 'react';
import NotificationToast from '../components/notification/NotificationToast';

const NotificationToastContext = createContext();

export const useToast = () => {
  const context = useContext(NotificationToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de NotificationToastProvider');
  }
  return context;
};

export const NotificationToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((notification) => {
    const toastId = Date.now().toString();
    
    const newToast = {
      id: toastId,
      ...notification,
      timestamp: Date.now()
    };

    setToasts(prev => [newToast, ...prev].slice(0, 3)); // Máximo 3 toasts
    
    return toastId;
  }, []);

  const hideToast = useCallback((toastId) => {
    setToasts(prev => prev.filter(toast => toast.id !== toastId));
  }, []);

  const hideAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <NotificationToastContext.Provider value={{ showToast, hideToast, hideAllToasts }}>
      {children}
      
      {/* Container para toasts - se renderiza en todas las páginas */}
      <div className="notification-toast-container">
        {toasts.map(toast => (
          <NotificationToast
            key={toast.id}
            notification={toast}
            onClose={() => hideToast(toast.id)}
            autoHide={true}
            duration={3000}
          />
        ))}
      </div>
    </NotificationToastContext.Provider>
  );
};