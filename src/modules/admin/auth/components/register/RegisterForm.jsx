import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaPhone } from 'react-icons/fa';
import RegisterPasswordInput from './RegisterPasswordInput';
import '/src/styles/components/auth/register/RegisterForm.css';

const emailRegex = /^\S+@\S+\.\S+$/;
const hasUpper = /[A-ZÁÉÍÓÚÑ]/;
const hasDigit = /\d/;
const hasSpecial = /[@#$%^&*]/;

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

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'name') {
      const clean = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      setFormData(prev => ({ ...prev, [name]: clean }));
      return;
    }
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: digits }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const passwordChecks = useMemo(() => {
    const { password } = formData;
    return {
      len: password.length >= 6,
      upper: hasUpper.test(password),
      digit: hasDigit.test(password),
      special: hasSpecial.test(password),
    };
  }, [formData.password]);

  const passwordValid = passwordChecks.len && passwordChecks.upper && passwordChecks.digit && passwordChecks.special;
  const emailValid = emailRegex.test(formData.email);
  const nameValid = formData.name.trim().length > 0;
  const phoneValid = formData.phone.length >= 7;
  const confirmMatches = formData.confirmPassword.length > 0 && formData.confirmPassword === formData.password;

  const showPasswordPanel = (touched.password || touched.confirmPassword);
  const showValid = (valueLen, isValid) => valueLen > 0 && isValid;
  const canSubmit = nameValid && emailValid && phoneValid && passwordValid && confirmMatches && !isLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true, password: true, confirmPassword: true });

    if (!canSubmit) return;

    try {
      setIsLoading(true);
      await new Promise(r => setTimeout(r, 1200));

      onRegisterSuccess();

      setFormData({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
      setTouched({ name: false, email: false, phone: false, password: false, confirmPassword: false });
      setShowPass(false);
      setShowConfirm(false);
    } catch {
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
    </div>
  );
};

export default RegisterForm;