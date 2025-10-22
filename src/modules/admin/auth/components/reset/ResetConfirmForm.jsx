import { useState, useEffect } from 'react';
import { FaLock, FaCheck, FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '/src/hooks/useAuth.js';
import '/src/styles/components/auth/reset/ResetConfirmForm.css';
import Modal from '/src/components/common/Modal';

const ResetConfirmForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    new_password: '',
    new_password_confirm: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const { confirmPasswordReset, error, clearError } = useAuth();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('success');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  // Get uid and token from URL
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!uid || !token) {
      setModalType('error');
      setModalTitle('Enlace inválido');
      setModalMessage('El enlace de recuperación es inválido o ha expirado.');
      setModalOpen(true);
    }
  }, [uid, token]);

  // Efecto para manejar errores del hook useAuth
  useEffect(() => {
    if (error) {
      setModalType('error');
      setModalTitle('Error');
      setModalMessage(error);
      setModalOpen(true);
      clearError();
    }
  }, [error, clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (passwordErrors.length > 0) {
      setPasswordErrors([]);
    }
  };

  const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra minúscula');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra mayúscula');
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push('La contraseña debe contener al menos un número');
    }
    
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('La contraseña debe contener al menos un carácter especial (@$!%*?&)');
    }
    
    return errors;
  };

  const validateForm = () => {
    const errors = validatePassword(formData.new_password);
    
    if (errors.length > 0) {
      setPasswordErrors(errors);
      return false;
    }

    if (formData.new_password !== formData.new_password_confirm) {
      setPasswordErrors(['Las contraseñas no coinciden']);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setPasswordErrors([]);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await confirmPasswordReset({
        uid,
        token,
        new_password: formData.new_password,
        new_password_confirm: formData.new_password_confirm
      });

      if (result && result.success) {
        setModalType('success');
        setModalTitle('¡Contraseña actualizada!');
        setModalMessage('Tu contraseña ha sido actualizada correctamente. Serás redirigido al login en unos segundos.');
        setModalOpen(true);
        
        // Redirect to login after success
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Tu contraseña ha sido actualizada correctamente. Puedes iniciar sesión con tu nueva contraseña.' 
            }
          });
        }, 3000);
      } else {
        setModalType('error');
        setModalTitle('Error');
        setModalMessage(result?.message || 'No se pudo actualizar la contraseña. Intenta nuevamente.');
        setModalOpen(true);
      }
    } catch (err) {
      console.error('Password reset confirmation failed:', err);
      // El error ya es manejado por el hook useAuth
    } finally {
      setIsLoading(false);
    }
  };

  if (!uid || !token) {
    return (
      <div className="reset-confirm-error">
        <h2>Enlace inválido</h2>
        <p>El enlace de recuperación es inválido o ha expirado.</p>
        <button 
          onClick={() => navigate('/reset-password')}
          className="reset-back-btn"
        >
          Solicitar nuevo enlace
        </button>
      </div>
    );
  }

  return (
    <div className="reset-confirm-form-card-inner">
      <form onSubmit={handleSubmit} className="reset-confirm-form">
        <div className="reset-confirm-form-header">
          <h2 className="reset-confirm-form-title">Nueva Contraseña</h2>
          <p className="reset-confirm-form-subtitle">
            Crea una nueva contraseña para tu cuenta
          </p>
        </div>

        <div className="reset-confirm-form-group">
          <label htmlFor="new_password" className="reset-confirm-form-label">
            Nueva Contraseña
          </label>
          <div className="reset-confirm-input-container">
            <FaLock className="reset-confirm-input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              id="new_password"
              name="new_password"
              className={`reset-confirm-input ${passwordErrors.length > 0 ? 'reset-confirm-input-invalid' : ''}`}
              placeholder="Ingresa tu nueva contraseña"
              value={formData.new_password}
              onChange={handleChange}
              autoComplete="new-password"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          
          {passwordErrors.length > 0 && (
            <div className="reset-confirm-errors">
              {passwordErrors.map((error, index) => (
                <span key={index} className="reset-confirm-error-message">
                  {error}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="reset-confirm-form-group">
          <label htmlFor="new_password_confirm" className="reset-confirm-form-label">
            Confirmar Contraseña
          </label>
          <div className="reset-confirm-input-container">
            <FaCheck className="reset-confirm-input-icon" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="new_password_confirm"
              name="new_password_confirm"
              className="reset-confirm-input"
              placeholder="Confirma tu nueva contraseña"
              value={formData.new_password_confirm}
              onChange={handleChange}
              autoComplete="new-password"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <button 
          type="submit" 
          className={`reset-confirm-btn ${isLoading ? 'reset-confirm-loading' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="reset-confirm-spinner"></div>
          ) : (
            'Actualizar Contraseña'
          )}
        </button>
      </form>
      
      <Modal 
        isOpen={modalOpen} 
        type={modalType} 
        title={modalTitle} 
        message={modalMessage} 
        onClose={() => {
          setModalOpen(false);
          if (modalType === 'success') {
            navigate('/login');
          }
        }} 
      />
    </div>
  );
};

export default ResetConfirmForm;