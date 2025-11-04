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
import { useAuth } from '../../contexts/AuthContext';
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
      <div className="profile-change-password-container">
        <div className="profile-change-password-header">
          <div className="profile-change-password-header-content">
            <p>Actualiza tu contraseña de forma segura</p>
          </div>
        </div>

        <div className="profile-password-content">
          {/* Security Tips */}
          <div className="profile-security-tips">
            <div className="profile-tips-header">
              <FaShieldAlt className="profile-tips-icon" />
              <h3>Consejos de Seguridad</h3>
            </div>
            <ul className="profile-tips-list">
              <li>Usa una contraseña única que no uses en otros sitios</li>
              <li>Combina letras, números y símbolos</li>
              <li>Evita información personal obvia</li>
              <li>Cambia tu contraseña regularmente</li>
            </ul>
          </div>

          {/* Password Form */}
          <form className="profile-password-form" onSubmit={handleSubmit}>
            <div className="profile-form-section">
              <div className="profile-section-header">
                <h3>Actualizar Contraseña</h3>
              </div>

              {/* Contraseña Actual */}
              <div className="profile-form-group">
                <label htmlFor="currentPassword">
                  Contraseña Actual <span className="profile-required">*</span>
                </label>
                <div className="profile-password-input-wrapper">
                  <FaKey className="profile-input-icon" />
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
                    className="profile-toggle-password"
                    onClick={() => toggleShowPassword('current')}
                  >
                    {showPassword.current ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <span className="profile-error-message">{errors.currentPassword}</span>
                )}
              </div>

              {/* Nueva Contraseña */}
              <div className="profile-form-group">
                <label htmlFor="newPassword">
                  Nueva Contraseña <span className="profile-required">*</span>
                </label>
                <div className="profile-password-input-wrapper">
                  <FaKey className="profile-input-icon" />
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
                    className="profile-toggle-password"
                    onClick={() => toggleShowPassword('new')}
                  >
                    {showPassword.new ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                
                {/* Barra de Fuerza */}
                {formData.newPassword && (
                  <div className="profile-password-strength">
                    <div className="profile-strength-bar">
                      <div 
                        className="profile-strength-fill"
                        style={{
                          width: `${(passwordStrength / 5) * 100}%`,
                          backgroundColor: getStrengthColor()
                        }}
                      ></div>
                    </div>
                    <span 
                      className="profile-strength-text"
                      style={{ color: getStrengthColor() }}
                    >
                      {getStrengthText()}
                    </span>
                  </div>
                )}

                {/* Requisitos */}
                {formData.newPassword && (
                  <div className="profile-password-requirements">
                    {passwordRequirements.map((req, index) => (
                      <div 
                        key={index}
                        className={`profile-requirement ${req.regex.test(formData.newPassword) ? 'met' : ''}`}
                      >
                        {req.regex.test(formData.newPassword) ? (
                          <FaCheck className="profile-req-icon success" />
                        ) : (
                          <FaTimes className="profile-req-icon" />
                        )}
                        <span>{req.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {errors.newPassword && (
                  <span className="profile-error-message">{errors.newPassword}</span>
                )}
              </div>

              {/* Confirmar Contraseña */}
              <div className="profile-form-group">
                <label htmlFor="confirmPassword">
                  Confirmar Contraseña <span className="profile-required">*</span>
                </label>
                <div className="profile-password-input-wrapper">
                  <FaKey className="profile-input-icon" />
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
                    className="profile-toggle-password"
                    onClick={() => toggleShowPassword('confirm')}
                  >
                    {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="profile-error-message">{errors.confirmPassword}</span>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="profile-form-actions">
              <button 
                type="button" 
                className="profile-btn-cancel"
                onClick={handleCancel}
                disabled={isChanging}
              >
                <FaTimes />
                <span>Cancelar</span>
              </button>
              <button 
                type="submit" 
                className="profile-btn-save"
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