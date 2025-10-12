import { useState } from 'react';
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { RiLockPasswordFill } from "react-icons/ri";
import '/src/styles/components/auth/login/LoginPasswordInput.css';

const LoginPasswordInput = ({ 
  password, 
  setPassword, 
  isLoading,
  showResetPassword = true 
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    // Si el usuario borra el campo, ocultar el password por seguridad
    if (!e.target.value) setShowPassword(false);
  };

  return (
    <div className="login-form-group">
      <label htmlFor="password" className="login-form-label">
        Contraseña
      </label>
      <div className="login-input-wrapper">
        <RiLockPasswordFill className="login-input-icon" />
        <input
          type={showPassword ? 'text' : 'password'}
          id="password"
          className="login-form-input"
          placeholder="Ingresa tu contraseña"
          value={password}
          onChange={handlePasswordChange}
          autoComplete="current-password"
          required
          disabled={isLoading}
        />
        {/* Mostrar el icono de ojo sólo cuando el usuario está escribiendo */}
        {password !== '' && (
          <button
            type="button"
            className="login-password-toggle"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            disabled={isLoading}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        )}
      </div>
      {showResetPassword && (
        <div className="login-reset-password">
          <a href="/reset-password">¿Olvidaste tu contraseña?</a>
        </div>
      )}
    </div>
  );
};

export default LoginPasswordInput;