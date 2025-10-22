import { useState, useEffect, useRef } from 'react';
import { FaTimes, FaUser, FaEnvelope, FaPhone, FaBuilding, FaIdCard, FaCalendarAlt, FaLock, FaUnlock, FaEye, FaEyeSlash } from 'react-icons/fa';
import '../../styles/components/management/UserModal.css';
import Modal from '../common/Modal';

const UserModal = ({ user, action, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'EMPLEADO',
    status: 'active',
    password: '',
    passwordConfirm: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const rulesRef = useRef(null);
  const passwordInputRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (user && action === 'edit') {
      // Para editar, separar el nombre completo en first_name y last_name
      const nameParts = user.name ? user.name.split(' ') : ['', ''];
      setFormData({
        firstName: user.firstName || nameParts[0] || '',
        lastName: user.lastName || nameParts.slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || user.telefono || '',
        role: user.role || 'EMPLEADO',
        status: user.status || 'active',
      });
    } else {
      // Para crear nuevo usuario
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'EMPLEADO',
        status: 'active',
        password: '',
        passwordConfirm: ''
      });
    }
    setErrors({});
  }, [user, action]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showRules && 
          rulesRef.current && 
          !rulesRef.current.contains(event.target) &&
          passwordInputRef.current && 
          !passwordInputRef.current.contains(event.target)) {
        setShowRules(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRules]);

  // Validación del formulario (sin cambios)
  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    if (formData.firstName && /[^A-Za-zÀ-ÖØ-öø-ÿ\s]/.test(formData.firstName)) {
      newErrors.firstName = 'El nombre solo puede contener letras y espacios';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }

    if (formData.lastName && /[^A-Za-zÀ-ÖØ-öø-ÿ\s]/.test(formData.lastName)) {
      newErrors.lastName = 'El apellido solo puede contener letras y espacios';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (action === 'create') {
      if (!formData.phone) {
        newErrors.phone = 'El teléfono es requerido';
      } else if (!/^\d{10}$/.test(formData.phone)) {
        newErrors.phone = 'El teléfono debe tener 10 dígitos';
      }
    } else {
      if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
        newErrors.phone = 'El teléfono debe tener 10 dígitos';
      }
    }

    if (!formData.role) {
      newErrors.role = 'El rol es requerido';
    }

    if (action === 'create') {
      if (!formData.password) {
        newErrors.password = 'La contraseña es requerida';
      } else if (formData.password.length < 6) {
        newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
      }

      if (!formData.passwordConfirm) {
        newErrors.passwordConfirm = 'Confirmar contraseña es requerido';
      } else if (formData.password !== formData.passwordConfirm) {
        newErrors.passwordConfirm = 'Las contraseñas no coinciden';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('🔍 Datos del formulario antes de validar:', formData);
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSave(formData);
      // Mostrar modal de resultado exitoso
      setResultModal({ isOpen: true, type: 'success', title: 'Cambio exitoso', message: action === 'create' ? 'Usuario creado correctamente.' : 'Cambios guardados correctamente.' });
      // Auto-close: después de 1.6s cerrar modal y el modal padre
      setTimeout(() => {
        setResultModal(prev => ({ ...prev, isOpen: false }));
        setIsSubmitting(false);
        onClose();
      }, 1600);
    } catch (err) {
      console.error(err);
      setResultModal({ isOpen: true, type: 'error', title: 'Error', message: 'No se pudo guardar el usuario. Intente nuevamente.' });
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === 'firstName' || name === 'lastName') {
      newValue = newValue.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, '');
    }

    if (name === 'phone') {
      newValue = newValue.replace(/\D/g, '').slice(0, 10);
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);
  const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  const handlePasswordFocus = () => {
    setShowRules(true);
  };

  const getTitle = () => {
    switch (action) {
      case 'create': return 'Crear Nuevo Usuario';
      case 'edit': return 'Editar Usuario';
      default: return 'Usuario';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <FaUnlock className="status-active" />;
      case 'inactive': return <FaLock className="status-inactive" />;
      case 'blocked': return <FaLock className="status-blocked" />;
      default: return <FaUnlock />;
    }
  };

  // Estado para modal de resultado (éxito/error)
  const [resultModal, setResultModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="user-modal" onClick={e => e.stopPropagation()} ref={modalRef}>
        <div className="modal-header">
          <h2>{getTitle()}</h2>
          <button 
            className="close-btn" 
            onClick={onClose} 
            aria-label="Cerrar modal"
            disabled={isSubmitting}
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="user-form" noValidate>
          <div className="form-grid">
            <div className="form-group">
              <label>
                <FaUser />
                Nombre *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="Ingrese el nombre"
                className={errors.firstName ? 'error' : ''}
                disabled={isSubmitting}
              />
              {errors.firstName && <span className="error-message">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <label>
                <FaUser />
                Apellido *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Ingrese el apellido"
                className={errors.lastName ? 'error' : ''}
                disabled={isSubmitting}
              />
              {errors.lastName && <span className="error-message">{errors.lastName}</span>}
            </div>

            <div className="form-group">
              <label>
                <FaEnvelope />
                Correo Electrónico *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="usuario@empresa.com"
                className={errors.email ? 'error' : ''}
                disabled={isSubmitting}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label>
                <FaPhone />
                Teléfono
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Ingrese su número de teléfono"
                pattern="\d{10}"
                maxLength={10}
                minLength={10}
                required={action === 'create'}
                className={errors.phone ? 'error' : ''}
                disabled={isSubmitting}
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>

            <div className="form-group">
              <label>
                <FaIdCard />
                Rol *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className={errors.role ? 'error' : ''}
                disabled={isSubmitting}
              >
                <option value="EMPLEADO">Empleado</option>
                <option value="ADMIN">Administrador</option>
              </select>
              {errors.role && <span className="error-message">{errors.role}</span>}
            </div>

            <div className="form-group">
              <label>
                <span className="status-icon">
                  {getStatusIcon(formData.status)}
                </span>
                Estado *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className={`status-select status-${formData.status} ${errors.status ? 'error' : ''}`}
                disabled={isSubmitting}
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="blocked">Bloqueado</option>
              </select>
              {errors.status && <span className="error-message">{errors.status}</span>}
            </div>

            {action === 'create' && (
              <>
                <div className="form-group password-group">
                  <label>
                    <FaLock />
                    Contraseña *
                  </label>
                  <div className="password-wrapper">
                    <input
                      ref={passwordInputRef}
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={handlePasswordFocus}
                      required
                      placeholder="Ingrese la contraseña"
                      className={errors.password ? 'error' : ''}
                      disabled={isSubmitting}
                    />
                    {formData.password.length > 0 && (
                      <button
                        type="button"
                        className={`password-toggle ${showPassword ? 'active' : ''}`}
                        onClick={toggleShowPassword}
                        disabled={isSubmitting}
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                      </button>
                    )}
                  </div>
                  
                  {/* Popover simplificado - se renderiza condicionalmente */}
                  {showRules && (
                    <div className="password-rules-popover" ref={rulesRef}>
                      <p className="rules-title">La contraseña debe tener:</p>
                      <ul className="rules-list">
                        <li className={formData.password.length >= 8 ? 'ok' : ''}>
                          {formData.password.length >= 8 ? '✓ ' : '• '}Mínimo 8 caracteres
                        </li>
                        <li className={/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(formData.password) ? 'ok' : ''}>
                          {/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(formData.password) ? '✓ ' : '• '}Al menos una letra
                        </li>
                        <li className={/\d/.test(formData.password) ? 'ok' : ''}>
                          {/\d/.test(formData.password) ? '✓ ' : '• '}Al menos un número
                        </li>
                      </ul>
                    </div>
                  )}
                  {errors.password && <span className="error-message">{errors.password}</span>}
                </div>

                <div className="form-group">
                  <label>
                    <FaLock />
                    Confirmar Contraseña *
                  </label>
                  <div className="password-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="passwordConfirm"
                      value={formData.passwordConfirm}
                      onChange={handleChange}
                      required
                      placeholder="Confirme la contraseña"
                      className={errors.passwordConfirm ? 'error' : ''}
                      disabled={isSubmitting}
                    />
                    {formData.passwordConfirm.length > 0 && (
                      <button 
                        type="button" 
                        className={`password-toggle ${showConfirmPassword ? 'active' : ''}`} 
                        onClick={toggleShowConfirmPassword}
                        disabled={isSubmitting}
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    )}
                  </div>
                  {errors.passwordConfirm && <span className="error-message">{errors.passwordConfirm}</span>}
                </div>
              </>
            )}
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={onClose} 
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-save" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Guardando...' : (action === 'create' ? 'Crear Usuario' : 'Guardar Cambios')}
            </button>
          </div>
        </form>
        {/* Modal de resultado */}
        <Modal
          isOpen={resultModal.isOpen}
          type={resultModal.type}
          title={resultModal.title}
          message={resultModal.message}
          onClose={() => setResultModal(prev => ({ ...prev, isOpen: false }))}
        />
      </div>
    </div>
  );
};

export default UserModal;