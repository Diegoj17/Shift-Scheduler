import { useState, useEffect, useRef } from 'react';
import { FaTimes, FaUser, FaEnvelope, FaPhone, FaBuilding, FaIdCard, FaCalendarAlt, FaLock, FaUnlock, FaEye, FaEyeSlash } from 'react-icons/fa';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { userService } from '../../services/userService';
import '../../styles/components/management/UserModal.css';

const UserModal = ({ user, action, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    status: 'active',
    password: '',
    passwordConfirm: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const departments = userService.getDepartments();
  const positions = userService.getPositions();
  const [showRules, setShowRules] = useState(false);
  const rulesRef = useRef(null);
  const passwordInputRef = useRef(null);
  const [popoverPos, setPopoverPos] = useState(null);

  useEffect(() => {
    if (user && action === 'edit') {
      // Para editar, separar el nombre completo en first_name y last_name
      const nameParts = user.name ? user.name.split(' ') : ['', ''];
      setFormData({
        firstName: user.firstName || nameParts[0] || '',
        lastName: user.lastName || nameParts.slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || '',
        position: user.position || '',
        status: user.status || 'active',
        password: '',
        passwordConfirm: ''
      });
    } else {
      // Para crear nuevo usuario
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: 'TI',
        position: 'Desarrollador',
        status: 'active',
        password: '',
        passwordConfirm: ''
      });
    }
    setErrors({});
  }, [user, action]);

  // Cerrar popover de reglas al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showRules) {
        if (rulesRef.current && !rulesRef.current.contains(event.target) &&
            passwordInputRef.current && !passwordInputRef.current.contains(event.target)) {
          setShowRules(false);
        }
      }
    };

    if (showRules) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showRules]);

  // Calcular y actualizar posición del popover (fixed) para que no quede recortado por el modal
  const updatePopoverPosition = () => {
    const input = passwordInputRef.current;
    if (!input) return;
    const rect = input.getBoundingClientRect();
    const top = rect.top; // viewport coordinates
    const left = rect.right + 12; // place 12px to the right
    setPopoverPos({ top, left });
  };

  useEffect(() => {
    if (showRules) {
      updatePopoverPosition();
      window.addEventListener('resize', updatePopoverPosition);
      window.addEventListener('scroll', updatePopoverPosition, true);
    }
    return () => {
      window.removeEventListener('resize', updatePopoverPosition);
      window.removeEventListener('scroll', updatePopoverPosition, true);
    };
  }, [showRules]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    }

    // Validar que nombre solo tenga letras y espacios
    if (formData.firstName && /[^A-Za-zÀ-ÖØ-öø-ÿ\s]/.test(formData.firstName)) {
      newErrors.firstName = 'El nombre solo puede contener letras y espacios';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    }

    // Validar que apellido solo tenga letras y espacios
    if (formData.lastName && /[^A-Za-zÀ-ÖØ-öø-ÿ\s]/.test(formData.lastName)) {
      newErrors.lastName = 'El apellido solo puede contener letras y espacios';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }

    // Validar teléfono: en creación es requerido y debe tener 10 dígitos
    if (action === 'create') {
      if (!formData.phone) {
        newErrors.phone = 'El teléfono es requerido';
      } else if (!/^\d{10}$/.test(formData.phone)) {
        newErrors.phone = 'El teléfono debe tener 10 dígitos';
      }
    } else {
      // En edición, si el usuario provee teléfono, validar 10 dígitos
      if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
        newErrors.phone = 'El teléfono debe tener 10 dígitos';
      }
    }

    if (!formData.department) {
      newErrors.department = 'El departamento es requerido';
    }

    if (!formData.position) {
      newErrors.position = 'El puesto es requerido';
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
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onSave(formData);
      // No necesitamos llamar setIsSubmitting(false) aquí porque onSave maneja el cierre del modal
    } catch  {
      // Los errores de la API se manejan en el componente padre
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    // Sanitizar entradas según campo
    if (name === 'firstName' || name === 'lastName') {
      // Permitir solo letras (incluye acentos) y espacios
      newValue = newValue.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, '');
    }

    if (name === 'phone') {
      // Permitir solo dígitos y limitar a 10 caracteres
      newValue = newValue.replace(/\D/g, '').slice(0, 10);
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    // Live validation: si está actualizando password o passwordConfirm, comprobar coincidencia
    if (name === 'password' || name === 'passwordConfirm') {
      setTimeout(() => {
        setErrors(prev => ({
          ...prev,
          passwordConfirm: (name === 'password' || name === 'passwordConfirm') && ( (name === 'password' ? newValue : formData.password) !== (name === 'passwordConfirm' ? newValue : formData.password) ) ? 'Las contraseñas no coinciden' : ''
        }));
      }, 0);
    }
  };

  const toggleShowPassword = () => setShowPassword(s => !s);
  const toggleShowConfirmPassword = () => setShowConfirmPassword(s => !s);

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="user-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{getTitle()}</h2>
          <button className="close-btn" onClick={onClose} aria-label="Cerrar modal">
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
                <FaBuilding />
                Departamento *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className={errors.department ? 'error' : ''}
                disabled={isSubmitting}
              >
                <option value="">Seleccionar departamento</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {errors.department && <span className="error-message">{errors.department}</span>}
            </div>

            <div className="form-group">
              <label>
                <FaIdCard />
                Puesto *
              </label>
              <select
                name="position"
                value={formData.position}
                onChange={handleChange}
                required
                className={errors.position ? 'error' : ''}
                disabled={isSubmitting}
              >
                <option value="">Seleccionar puesto</option>
                {positions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
              {errors.position && <span className="error-message">{errors.position}</span>}
            </div>

            <div className="form-group">
              <label>
                {getStatusIcon(formData.status)}
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
                <div className="form-group">
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
                      onChange={(e) => { handleChange(e); setShowRules(true); }}
                      onFocus={() => setShowRules(true)}
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
                        aria-pressed={showPassword}
                      >
                        {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                      </button>
                    )}

                    {/* Popover de reglas de contraseña */}
                    {showRules && (
                      <div
                        className={`password-rules-popover ${popoverPos ? 'fixed' : ''}`}
                        ref={rulesRef}
                        style={popoverPos ? { position: 'fixed', top: popoverPos.top + 'px', left: popoverPos.left + 'px' } : undefined}
                      >
                        <div className="popover-arrow" />
                        <p className="rules-title">La contraseña debe tener:</p>
                        <ul className="rules-list">
                          <li className={formData.password.length >= 8 ? 'ok' : ''}>{formData.password.length >= 8 ? '✓ ' : '• '}Mínimo 8 caracteres</li>
                          <li className={/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(formData.password) ? 'ok' : ''}>{/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(formData.password) ? '✓ ' : '• '}Al menos una letra</li>
                          <li className={/\d/.test(formData.password) ? 'ok' : ''}>{/\d/.test(formData.password) ? '✓ ' : '• '}Al menos un número</li>
                        </ul>
                      </div>
                    )}
                    </div>
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
                      aria-invalid={!!errors.passwordConfirm}
                      disabled={isSubmitting}
                    />
                    {formData.passwordConfirm.length > 0 && (
                      <button type="button" className={`password-toggle ${showConfirmPassword ? 'active' : ''}`} onClick={toggleShowConfirmPassword} aria-pressed={showConfirmPassword}>
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
      </div>
    </div>
  );
};

export default UserModal;