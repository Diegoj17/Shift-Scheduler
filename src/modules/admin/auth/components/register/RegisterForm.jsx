import { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '/src/hooks/useAuth.js';
import { FaUser, FaEnvelope, FaPhone } from 'react-icons/fa';
import RegisterPasswordInput from './RegisterPasswordInput';
import '/src/styles/components/auth/register/RegisterForm.css';
import Modal from '/src/components/common/Modal';

const emailRegex = /^\S+@\S+\.\S+$/;
const hasLetter = /[a-zA-ZÁÉÍÓÚÑáéíóúñ]/;
const hasDigit = /\d/;

const RegisterForm = ({ onRegisterSuccess, onRegisterError }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
  });

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, clearError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'name') {
      const clean = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      setFormData(prev => ({ ...prev, [name]: clean }));
      return;
    }
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '');
      const limited = digits.slice(0, 10); // máximo 10 dígitos
      setFormData(prev => ({ ...prev, [name]: limited }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const passwordChecks = useMemo(() => {
    const password = formData.password;
    return {
      len: password.length >= 8, // Cambiado a 8 caracteres
      letter: hasLetter.test(password), // Nueva validación: debe tener letras
      digit: hasDigit.test(password), // Debe tener al menos un número
    };
  }, [formData.password]);

  const passwordValid = passwordChecks.len && passwordChecks.letter && passwordChecks.digit;
  const emailValid = emailRegex.test(formData.email);
  const nameValid = formData.name.trim().length > 0;
  const phoneValid = formData.phone.length >= 7;
  const confirmMatches = formData.confirmPassword.length > 0 && formData.confirmPassword === formData.password;

  const showPasswordPanel = (touched.password || touched.confirmPassword);
  const canSubmit = nameValid && emailValid && phoneValid && passwordValid && confirmMatches && !isLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true, password: true, confirmPassword: true });
    clearError();

    if (!canSubmit) return;

    try {
      setIsLoading(true);
      
      // Dividir el nombre completo en first_name y last_name
      const nameParts = formData.name.trim().split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';

      // Preparar datos para el registro
      const userData = {
        first_name,
        last_name,
        email: formData.email,
        telefono: formData.phone,
        password: formData.password,
        password_confirm: formData.confirmPassword,
        role: 'EMPLEADO' // Rol automático en mayúsculas
      };

      // Llamar al servicio de registro
      const result = await register(userData);
      
      if (result.success) {
        // Mostrar modal de éxito con el mensaje del backend si existe
        setModalType('success');
        setModalTitle('Registro exitoso');
        setModalMessage(result.data?.message || 'Tu cuenta se ha creado correctamente.');
        setModalOpen(true);

        onRegisterSuccess();
        // Redirigir al login después de registro exitoso (mantenemos el delay)
        setTimeout(() => {
          navigate('/login');
        }, 2000);

        // Resetear formulario
        setFormData({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
        setTouched({ name: false, email: false, phone: false, password: false, confirmPassword: false });
        setShowPass(false);
        setShowConfirm(false);
      } else {
        setModalType('error');
        setModalTitle('Error');
        setModalMessage(result?.message || 'No se pudo completar el registro.');
        setModalOpen(true);

        onRegisterError();
      }
    } catch (error) {
      console.error('Error en registro:', error);
      onRegisterError();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePasswordBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('success');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  // Auto-cerrar modal de éxito
  useEffect(() => {
    let t;
    if (modalOpen && modalType === 'success') {
      t = setTimeout(() => setModalOpen(false), 2500);
    }
    return () => clearTimeout(t);
  }, [modalOpen, modalType]);
  return (
    <div className="register-form-card-inner">
      <div className="register-form-header">
        <h2>Crear Cuenta</h2>
        <p>Completa tus datos para registrarte</p>
      </div>

      <form onSubmit={handleSubmit} className="register-form">
        {/* NOMBRE COMPLETO */}
        <div className="register-form-group">
          <label htmlFor="name" className="register-form-label">
            Nombre Completo *
          </label>
          <div className="register-input-container">
            <FaUser className="register-input-icon" />
            <input
              type="text"
              id="name"
              name="name"
              className={`register-input ${touched.name && !nameValid ? 'register-input-invalid' : ''}`}
              placeholder="Ingresa tu nombre completo"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
              autoComplete="off"
            />
          </div>
          {touched.name && !nameValid && (
            <span className="register-field-hint register-error">Solo letras y espacios.</span>
          )}
        </div>

        {/* EMAIL */}
        <div className="register-form-group">
          <label htmlFor="email" className="register-form-label">
            Correo Electrónico *
          </label>
          <div className="register-input-container">
            <FaEnvelope className="register-input-icon" />
            <input
              type="email"
              id="email"
              name="email"
              className={`register-input ${touched.email && !emailValid ? 'register-input-invalid' : ''}`}
              placeholder="Ingresa tu correo electrónico"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={isLoading}
              autoComplete="off"
            />
          </div>
          {touched.email && !emailValid && (
            <span className="register-field-hint register-error">Correo inválido (debe contener "@").</span>
          )}
        </div>

        {/* TELÉFONO */}
        <div className="register-form-group">
          <label htmlFor="phone" className="register-form-label">
            Teléfono
          </label>
          <div className="register-input-container">
            <FaPhone className="register-input-icon" />
            <input
              type="tel"
              id="phone"
              name="phone"
              className={`register-input ${touched.phone && formData.phone.length > 0 && !phoneValid ? 'register-input-invalid' : ''}`}
              placeholder="Número de contacto"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              maxLength={10}
              disabled={isLoading}
              autoComplete="off"
            />
          </div>
        </div>

        {/* CONTRASEÑAS */}
        <RegisterPasswordInput
          formData={formData}
          touched={touched}
          showPass={showPass}
          showConfirm={showConfirm}
          showPasswordPanel={showPasswordPanel}
          passwordChecks={passwordChecks}
          passwordValid={passwordValid}
          confirmMatches={confirmMatches}
          isLoading={isLoading}
          onPasswordChange={handlePasswordChange}
          onPasswordBlur={handlePasswordBlur}
          onToggleShowPass={() => setShowPass(s => !s)}
          onToggleShowConfirm={() => setShowConfirm(s => !s)}
        />

        <button
          type="submit"
          className={`register-submit-btn ${isLoading ? 'register-loading' : ''}`}
          disabled={!canSubmit}
        >
          {isLoading ? <div className="register-spinner"></div> : 'Crear Cuenta'}
        </button>

      </form>
      <Modal isOpen={modalOpen} type={modalType} title={modalTitle} message={modalMessage} onClose={() => setModalOpen(false)} />
    </div>
  );
};

export default RegisterForm;