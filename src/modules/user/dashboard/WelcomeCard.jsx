import React, { useEffect, useState } from 'react';
import { FaRegCalendarAlt, FaClock } from 'react-icons/fa';
import '../../../styles/components/dashboard/user/WelcomeCard.css';
import authService from '../../../services/authService';

const WelcomeCard = ({ currentTime }) => {
  const [userName, setUserName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    
    const fetchProfile = async () => {
      try {
        const profile = await authService.getProfile();
        if (!mounted) return;
        
        // Extraer el nombre del perfil con múltiples opciones posibles
        const name = profile.first_name || 
                    profile.firstName || 
                    profile.name || 
                    profile.user?.first_name || 
                    profile.user?.name || 
                    'Usuario';
        
        setUserName(name);

        const lastName = profile.last_name || 
                        profile.lastName || 
                        profile.surname ||
                        profile.user?.last_name || 
                        profile.user?.surname || 
                        'Usuario';
        setLastName(lastName);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || 'Error al cargar perfil');
        setUserName('Usuario'); // Valor por defecto en caso de error
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProfile();
    return () => { mounted = false; };
  }, []);

  // Función para determinar el saludo según la hora
  const getGreeting = () => {
    const hour = currentTime.getHours();
    
    if (hour >= 5 && hour < 12) {
      return 'Buenos días';
    } else if (hour >= 12 && hour < 19) {
      return 'Buenas tardes';
    } else {
      return 'Buenas noches';
    }
  };

  const firstName = userName.split(' ')[0];

  const formattedDate = currentTime.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  if (loading) {
    return (
      <div className="welcome-dashboard-container">
        <div className="welcome-top-row">
          <div className="welcome-greeting-section">
            <h2 className="welcome-title">Cargando...</h2>
            <p className="welcome-subtitle">Aquí tienes un resumen de tu jornada de hoy</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="welcome-dashboard-container">
      <div className="welcome-top-row">
        <div className="welcome-greeting-section">
          <h2 className="welcome-title">¡{getGreeting()}, {firstName} {lastName}!</h2>
          <p className="welcome-subtitle">Aquí tienes un resumen de tu jornada de hoy</p>
          {error && <p className="welcome-error">Error: {error}</p>}
        </div>

        <div className="welcome-datetime-display">
          <div className="info-card date-card">
            <div className="info-icon"><FaRegCalendarAlt /></div>
            <div className="info-content">
              <div className="info-label">Fecha</div>
              <div className="info-value">{formattedDate}</div>
            </div>
          </div>

          <div className="info-card time-card">
            <div className="info-icon"><FaClock /></div>
            <div className="info-content">
              <div className="info-label">Hora</div>
              <div className="info-value">{formattedTime}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;