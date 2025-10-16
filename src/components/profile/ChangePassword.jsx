import React, { useState } from 'react';
import { 
  FaKey, 
  FaEye, 
  FaEyeSlash, 
  FaCheck, 
  FaTimes,
  FaShieldAlt
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ProfileLayout from './layout/ProfileLayout';
import '../../styles/components/profile/ChangePassword.css';

const ChangePassword = () => {
  const navigate = useNavigate();
  const { changePassword } = useAuth();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [errors, setErrors] = useState({});
  const [isChanging, setIsChanging] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Requisitos de contraseña
  const passwordRequirements = [
    { regex: /.{8,}/, text: 'Al menos 8 caracteres' },
    { regex: /[A-Z]/, text: 'Una letra mayúscula' },
    { regex: /[a-z]/, text: 'Una letra minúscula' },
    { regex: /[0-9]/, text: 'Un número' },
    { regex: /[^A-Za-z0-9]/, text: 'Un carácter especial' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Calcular fuerza de contraseña
    if (name === 'newPassword') {
      const strength = passwordRequirements.filter(req => req.regex.test(value)).length;
      setPasswordStrength(strength);
    }

    // Limpiar errores
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const toggleShowPassword = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'La contraseña actual es requerida';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'La nueva contraseña es requerida';
    } else {
      const unmetRequirements = passwordRequirements.filter(
        req => !req.regex.test(formData.newPassword)
      );
      if (unmetRequirements.length > 0) {
        newErrors.newPassword = 'La contraseña no cumple los requisitos';
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu nueva contraseña';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'La nueva contraseña debe ser diferente';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsChanging(true);

    // Cambiar contraseña usando el contexto
    const result = await changePassword(
      formData.currentPassword,
      formData.newPassword
    );
    
    setIsChanging(false);
    
    if (result.success) {
      console.log('Contraseña cambiada exitosamente');
      navigate('/profile');
    } else {
      console.error('Error al cambiar contraseña:', result.error);
      setErrors({
        currentPassword: 'Contraseña incorrecta'
      });
    }
  };

  const handleCancel = () => {
    navigate('/profile');
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return '#ef4444';
    if (passwordStrength <= 3) return '#f59e0b';
    if (passwordStrength <= 4) return '#3b82f6';
    return '#10b981';
  };

  const getStrengthText = () => {
    if (passwordStrength <= 2) return 'Débil';
    if (passwordStrength <= 3) return 'Media';
    if (passwordStrength <= 4) return 'Buena';
    return 'Fuerte';
  };

  return (
    <ProfileLayout pageTitle="Cambiar Contraseña">
      <div className="change-password-container">
      <div className="change-password-header">
        <div className="header-content">
          <h1>Cambiar Contraseña</h1>
          <p>Actualiza tu contraseña de forma segura</p>
        </div>
      </div>

      <div className="password-content">
        {/* Security Tips */}
        <div className="security-tips">
          <div className="tips-header">
            <FaShieldAlt className="tips-icon" />
            <h3>Consejos de Seguridad</h3>
          </div>
          <ul className="tips-list">
            <li>Usa una contraseña única que no uses en otros sitios</li>
            <li>Combina letras, números y símbolos</li>
            <li>Evita información personal obvia</li>
            <li>Cambia tu contraseña regularmente</li>
          </ul>
        </div>

        {/* Password Form */}
        <form className="password-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="section-header">
              <FaKey className="section-icon" />
              <h3>Actualizar Contraseña</h3>
            </div>

            {/* Contraseña Actual */}
            <div className="form-group">
              <label htmlFor="currentPassword">
                Contraseña Actual <span className="required">*</span>
              </label>
              <div className="password-input-wrapper">
                <FaKey className="input-icon" />
                <input
                  type={showPassword.current ? 'text' : 'password'}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className={errors.currentPassword ? 'error' : ''}
                  placeholder="Ingresa tu contraseña actual"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => toggleShowPassword('current')}
                >
                  {showPassword.current ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.currentPassword && (
                <span className="error-message">{errors.currentPassword}</span>
              )}
            </div>

            {/* Nueva Contraseña */}
            <div className="form-group">
              <label htmlFor="newPassword">
                Nueva Contraseña <span className="required">*</span>
              </label>
              <div className="password-input-wrapper">
                <FaKey className="input-icon" />
                <input
                  type={showPassword.new ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className={errors.newPassword ? 'error' : ''}
                  placeholder="Ingresa tu nueva contraseña"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => toggleShowPassword('new')}
                >
                  {showPassword.new ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              
              {/* Barra de Fuerza */}
              {formData.newPassword && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill"
                      style={{
                        width: `${(passwordStrength / 5) * 100}%`,
                        backgroundColor: getStrengthColor()
                      }}
                    ></div>
                  </div>
                  <span 
                    className="strength-text"
                    style={{ color: getStrengthColor() }}
                  >
                    {getStrengthText()}
                  </span>
                </div>
              )}

              {/* Requisitos */}
              {formData.newPassword && (
                <div className="password-requirements">
                  {passwordRequirements.map((req, index) => (
                    <div 
                      key={index}
                      className={`requirement ${req.regex.test(formData.newPassword) ? 'met' : ''}`}
                    >
                      {req.regex.test(formData.newPassword) ? (
                        <FaCheck className="req-icon success" />
                      ) : (
                        <FaTimes className="req-icon" />
                      )}
                      <span>{req.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {errors.newPassword && (
                <span className="error-message">{errors.newPassword}</span>
              )}
            </div>

            {/* Confirmar Contraseña */}
            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirmar Contraseña <span className="required">*</span>
              </label>
              <div className="password-input-wrapper">
                <FaKey className="input-icon" />
                <input
                  type={showPassword.confirm ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'error' : ''}
                  placeholder="Confirma tu nueva contraseña"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => toggleShowPassword('confirm')}
                >
                  {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword}</span>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-cancel"
              onClick={handleCancel}
              disabled={isChanging}
            >
              <FaTimes />
              <span>Cancelar</span>
            </button>
            <button 
              type="submit" 
              className="btn-save"
              disabled={isChanging}
            >
              <FaKey />
              <span>{isChanging ? 'Cambiando...' : 'Cambiar Contraseña'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    </ProfileLayout>
  );
};

export default ChangePassword;