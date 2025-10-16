import React, { useState, useRef, useEffect } from 'react';
import { FaUser, FaKey, FaSignOutAlt, FaChevronDown, FaCog } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // Ajusta la ruta según tu estructura
import '../../styles/components/profile/ProfileMenu.css';

const ProfileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  // Función para obtener iniciales
  const getInitials = (user) => {
    if (!user) return 'U';
    const firstName = user.first_name || user.firstName || '';
    const lastName = user.last_name || user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'U';
  };

  // Función para obtener nombre completo
  const getFullName = (user) => {
    if (!user) return 'Usuario';
    const firstName = user.first_name || user.firstName || '';
    const lastName = user.last_name || user.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Usuario';
  };

  // Función para obtener rol formateado
  const getRoleLabel = (role) => {
    const roleMap = {
      'GERENTE': 'Gerente',
      'ADMIN': 'Administrador',
      'EMPLEADO': 'Empleado',
      'SUPERVISOR': 'Supervisor'
    };
    return roleMap[role] || role || 'Usuario';
  };

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleViewProfile = () => {
    setIsOpen(false);
    navigate('/profile');
  };

  const handleChangePassword = () => {
    setIsOpen(false);
    navigate('/change-password');
  };

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/login');
  };

  // Prepara datos (usa valores por defecto para invitados)
  const initials = getInitials(currentUser);
  const fullName = getFullName(currentUser);
  const roleLabel = getRoleLabel(currentUser ? currentUser.role : 'INVITADO');

  return (
    <div className="profile-menu-container" ref={menuRef}>
      <button className="profile-trigger" onClick={toggleMenu}>
        <div className="profile-avatar">{initials}</div>
        <div className="profile-info">
          <span className="profile-name">{fullName}</span>
          <span className="profile-role">{roleLabel}</span>
        </div>
        <FaChevronDown className={`profile-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="profile-dropdown">
          <div className="dropdown-header">
            <div className="dropdown-avatar">{initials}</div>
            <div className="dropdown-user-info">
              <h4>{fullName}</h4>
              <p>{currentUser ? (currentUser.email || 'usuario@ejemplo.com') : 'invitado@ejemplo.com'}</p>
            </div>
          </div>

          <div className="dropdown-divider"></div>

          <div className="dropdown-menu">
            {currentUser ? (
              <>
                <button className="dropdown-item" onClick={handleViewProfile}>
                  <FaUser className="dropdown-icon" />
                  <span>Ver Perfil</span>
                </button>

                <button className="dropdown-item" onClick={handleChangePassword}>
                  <FaKey className="dropdown-icon" />
                  <span>Cambiar Contraseña</span>
                </button>

                <div className="dropdown-divider"></div>

                <button className="dropdown-item logout" onClick={handleLogout}>
                  <FaSignOutAlt className="dropdown-icon" />
                  <span>Cerrar Sesión</span>
                </button>
              </>
            ) : (
              <>
                <button className="dropdown-item" onClick={() => { setIsOpen(false); navigate('/login'); }}>
                  <FaUser className="dropdown-icon" />
                  <span>Iniciar Sesión</span>
                </button>

                <button className="dropdown-item" onClick={() => { setIsOpen(false); navigate('/register'); }}>
                  <FaCog className="dropdown-icon" />
                  <span>Registrarse</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;